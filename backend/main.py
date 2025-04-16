import requests
import re
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_code_files_from_link(repo_url, extensions=[".py", ".ts", ".js"]):
    """
    Fetches code files from a GitHub repository using the provided URL.
    
    Args:
        repo_url (str): The URL of the GitHub repository.
        extensions (list): List of file extensions to filter by.
        
    Returns:
        dict: A dictionary with file paths as keys and their content as values.
    """
    # Extract owner and repo name from the URL
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        raise ValueError("Invalid GitHub repository URL")
    
    owner, repo = match.groups()
    
    return get_code_files_from_repo(owner, repo, extensions)

# Existing code...
def get_code_files_from_repo(owner, repo, extensions=[".py", ".ts", ".js"]):
    # First, get repository details to find the default branch
    repo_url = f"https://api.github.com/repos/{owner}/{repo}"
    headers = {"Accept": "application/vnd.github+json"}
    repo_info = requests.get(repo_url, headers=headers)
    
    if repo_info.status_code != 200:
        print(f"Error fetching repo info: {repo_info.status_code}")
        return {}
    
    default_branch = repo_info.json().get('default_branch', 'main')  # Default to 'main' if not found
    
    # Step 1: Get all file paths using the default branch
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
    r = requests.get(url, headers=headers)
    
    if r.status_code != 200:
        print(f"Error fetching tree: {r.status_code}")
        return {}
    
    file_paths = [f['path'] for f in r.json()['tree'] if any(f['path'].endswith(ext) for ext in extensions)]
    
    # Step 2: Get raw content using the default branch
    base_raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/"
    files = {}
    for path in file_paths[:5]:  # Limit to 5 for now
        raw_url = base_raw_url + path
        content = requests.get(raw_url).text
        files[path] = content
    return files

def analyze_style(code):
    indent = re.findall(r'^([ \t]+)', code, re.MULTILINE)
    indent_style = max(set(indent), key=indent.count) if indent else "  "  # default 2-space
    indent_size = len(indent_style.replace('\t', '   '))
    
    comments = len(re.findall(r'#', code))
    lines = len(code.split('\n'))
    comment_density = round(comments / lines, 2)

    snake_case = len(re.findall(r'\b[a-z]+(_[a-z0-9]+)+\b', code))
    camel_case = len(re.findall(r'\b[a-z]+([A-Z][a-z0-9]+)+\b', code))
    naming = "snake_case" if snake_case >= camel_case else "camelCase"

    return {
        "indent_size": indent_size,
        "comment_density": comment_density,
        "naming": naming
    }

# New function to make an LLM call for code analysis
def analyze_code_with_llm(code):
    """
    Uses an LLM to analyze code and extract comprehensive features.
    """
    # API endpoint and key
    api_url = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
    api_key = os.getenv("LLM_API_KEY")
    
    if not api_key:
        return {"error": "LLM API key not found in environment variables"}
    
    # Prompt template for the LLM
    prompt = f"""
    Analyze the following code and extract these features:
    
    1. Basic Statistics:
       - Count of lines (total, non-blank, code-only)
       - Average line length
       
    2. Code Structure:
       - Number of functions/methods
       - Number of classes
       - Main imports and dependencies
       
    3. Code Complexity:
       - Estimated cyclomatic complexity
       - Maximum nesting depth
       
    4. Best Practices:
       - Documentation quality (0-10)
       - Error handling presence (0-10)
       - Code organization (0-10)
       
    5. Semantic Analysis:
       - Brief description of code purpose
       - Identified patterns or algorithms
       - Potential bugs or code smells
       - Refactoring suggestions
    
    Format your response as a JSON object with these categories.
    
    CODE:
    ```
    {code}
    ```
    """
    
    # API request
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": "gpt-4",  # Or your preferred model
        "messages": [
            {"role": "system", "content": "You are a code analysis assistant that extracts features from code."},
            {"role": "user", "content": prompt}
        ],
        "response_format": { "type": "json_object" },
        "temperature": 0.3  # Lower temperature for more consistent analysis
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response_data = response.json()
        
        # Extract content from response
        if "choices" in response_data and len(response_data["choices"]) > 0:
            analysis_text = response_data["choices"][0]["message"]["content"]
            # Try to parse JSON from the response
            try:
                # Find JSON in the response if it's wrapped in markdown or text
                json_str = re.search(r'```json\n(.*?)\n```', analysis_text, re.DOTALL)
                if json_str:
                    analysis_json = json.loads(json_str.group(1))
                else:
                    analysis_json = json.loads(analysis_text)
                return analysis_json
            except json.JSONDecodeError:
                # If response isn't valid JSON, return the text with error note
                return {
                    "error": "Could not parse JSON from LLM response",
                    "raw_response": analysis_text
                }
        else:
            return {"error": "No valid response from LLM"}
    
    except Exception as e:
        return {"error": f"Error calling LLM API: {str(e)}"}

# Function to combine traditional and LLM analysis
def comprehensive_code_analysis(code):
    # Get basic style metrics using regex
    style_metrics = analyze_style(code)
    
    # Get advanced analysis using LLM
    llm_analysis = analyze_code_with_llm(code)
    
    # Combine the results
    return {
        "style_metrics": style_metrics,
        "llm_analysis": llm_analysis
    }

# Example usage
if __name__ == "__main__":
    # Example GitHub repo and file analysis
    owner = "Greg-Lim"
    repo = "SC4052-Assignment-2"

    link = "https://github.com/Greg-Lim/SC4052-Assignment-2"
    
    files = get_code_files_from_link(link, extensions=[".py", ".ts", ".js"])

    files = files.paths[:2]  # Limit to 2 for now
    
    for path, code in files.items():
        print(f"Analyzing {path}...")
        analysis = comprehensive_code_analysis(code)
        print(json.dumps(analysis, indent=2))