def bubble_sort(arr):
    n = len(arr)
    for i in range(1,n-1):
        for j in range(1, n-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr