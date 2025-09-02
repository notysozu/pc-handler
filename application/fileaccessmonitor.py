'''
most accessed files will be detected and reported
will add to main file later
'''
# file_access_monitor.py
# A script to monitor a directory for file access events and count which
# files are accessed most frequently, using only built-in Python libraries.

import os
import sys
import time
import threading
from collections import Counter

# A global dictionary to store the last known access time for each file.
# This allows us to detect when a file has been opened since the last check.
last_access_times = {}

# A global counter to store the frequency of file access
file_access_counter = Counter()

def poll_directory(path: str):
    """
    Scans the directory and its subdirectories to detect file access events.
    It checks the file's 'st_atime' (last access time) against a stored value.
    """
    print("Polling for file changes...")
    
    # We use os.walk to recursively traverse the directory
    for root, _, files in os.walk(path):
        for file_name in files:
            file_path = os.path.join(root, file_name)
            
            # We use a try-except block to handle cases where a file might
            # be deleted or permissions change between checks.
            try:
                # Use os.stat to get the file's metadata, including access time.
                current_access_time = os.stat(file_path).st_atime
                
                # Check if the file is new or its access time has been updated.
                if file_path not in last_access_times or last_access_times[file_path] < current_access_time:
                    # Increment the counter for the file name.
                    file_access_counter[file_name] += 1
                    
                    # Store the new access time.
                    last_access_times[file_path] = current_access_time
                    
                    print(f"Detected open event for: {file_name}")

            except OSError as e:
                # Print a warning for files that are inaccessible.
                # In a real tool, you might add more robust error handling here.
                print(f"Warning: Could not access file '{file_path}'. Error: {e}")

def print_top_files():
    """
    A function to print the most frequently accessed files.
    This runs on a separate thread to not block the main polling loop.
    """
    print("\n" + "="*40)
    print("Most Frequently Accessed Files (Top 10):")
    
    # Get the 10 most common file names from the counter
    top_files = file_access_counter.most_common(10)
    
    if not top_files:
        print("No files have been accessed yet.")
    else:
        for file_name, count in top_files:
            print(f"  - {file_name}: {count} times")
            
    print("="*40 + "\n")
    
    # Schedule the next run of this function in 30 seconds.
    threading.Timer(30, print_top_files).start()

def monitor_directory(path: str, poll_interval: int = 5):
    """
    Starts the monitoring process for a specified directory.
    
    Args:
        path (str): The directory to monitor.
        poll_interval (int): How often, in seconds, to poll the directory.
    """
    # Start the timer to print the results periodically
    print_top_files()

    print(f"Starting file access monitor for '{path}'...")
    print(f"Polling every {poll_interval} seconds. Press Ctrl+C to stop.")

    try:
        # Keep the main thread alive and poll the directory in a continuous loop.
        while True:
            poll_directory(path)
            time.sleep(poll_interval)
            
    except KeyboardInterrupt:
        print("\nMonitor stopped.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # Perform a final printout of the results on exit
        print_top_files()

if __name__ == "__main__":
    # Check if a directory path was provided as a command-line argument
    if len(sys.argv) < 2:
        print("Usage: python file_access_monitor.py <directory_path>")
        sys.exit(1)

    directory_to_monitor = sys.argv[1]

    # Verify that the provided path exists and is a directory
    if not os.path.isdir(directory_to_monitor):
        print(f"Error: The provided path '{directory_to_monitor}' is not a valid directory.")
        sys.exit(1)

    monitor_directory(directory_to_monitor)
