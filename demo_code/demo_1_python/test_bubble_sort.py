import pytest
from bubble_sort import bubble_sort


class TestBubbleSort:
    def test_bubble_sort_already_sorted(self):
        """Test that bubble sort works on already sorted arrays."""
        arr = [1, 2, 3, 4, 5]
        assert bubble_sort(arr) == [1, 2, 3, 4, 5]

    def test_bubble_sort_empty_array(self):
        """Test that bubble sort handles empty arrays."""
        arr = []
        assert bubble_sort(arr) == []

    def test_bubble_sort_single_element(self):
        """Test that bubble sort handles single element arrays."""
        arr = [42]
        assert bubble_sort(arr) == [42]

    def test_bubble_sort_random_array(self):
        """Test that bubble sort works on random arrays."""
        arr = [1, 3, 8, 4, 2]
        assert bubble_sort(arr) == [1, 2, 3, 4, 8]

    def test_bubble_sort_reverse_sorted(self):
        """Test that bubble sort works on reverse sorted arrays."""
        arr = [5, 4, 3, 2, 1]
        assert bubble_sort(arr) == [1, 2, 3, 4, 5]

    def test_bubble_sort_comparison_count(self, monkeypatch):
        """Test that bubble sort makes the expected number of comparisons."""
        arr = [5, 4, 3, 2, 1]
        comparison_count = 0
        
        original_lt = int.__lt__
        
        def counting_lt(self, other):
            nonlocal comparison_count
            comparison_count += 1
            return original_lt(self, other)
        
        monkeypatch.setattr(int, "__lt__", counting_lt)
        
        bubble_sort(arr)
        
        # For a bubble sort of n elements, worst case requires
        # n*(n-1)/2 comparisons (n=5 elements requires 10 comparisons)
        expected_comparisons = len(arr) * (len(arr) - 1) // 2
        assert comparison_count == expected_comparisons