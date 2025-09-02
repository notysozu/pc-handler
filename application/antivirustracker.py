'''
The Python file enumerates all minifilter drivers currently loaded on a Windows system. Minifilter drivers are commonly used by antivirus software to monitor file system activity. By listing these drivers, you can identify what antivirus or security products are installed.

Step-by-Step Explanation
Imports and Setup

Uses ctypes to call Windows API functions directly.
Loads fltlib.dll, which provides functions to interact with filter drivers.
Structures and Constants

Defines a FILTER_FULL_INFORMATION structure to hold filter driver info.
Sets constants like MAX_PATH (maximum path length), error codes, and the information class for queries.
Win32FromHResult Function

Converts HRESULT error codes from Windows API calls into standard Win32 error codes for easier error handling.
Main Function Logic

Allocates memory for the filter information structure.
Calls FilterFindFirst to get the first minifilter driver and its information.
If successful, prints the filter’s name.
Loops using FilterFindNext to enumerate subsequent filter drivers, printing each name.
Handles errors and stops the loop when no more drivers are found.
Cleanup

Closes the filter handle and frees allocated memory after finishing or if an error occurs.
Practical Usage
Security Analysis:
By running this script, you’ll see the names of all minifilter drivers (used by AV products and other security tools). These names can be matched with known antivirus minifilter drivers to identify installed security products.

Forensics:
Useful for malware analysts or system investigators to check which file system filters are active, especially those not visible via standard software lists.

Requirements & Limitations
Windows Only:
This script only works on Windows and requires access to fltlib.dll.
Administrator Rights:
You may need elevated privileges to query filter drivers.
Python Environment:
You must run this as a Python script from an environment where ctypes and the necessary DLLs are available.


'''
import ctypes
from ctypes import wintypes

fltlib = ctypes.WinDLL('fltlib.dll')

# Define necessary constants and types
MAX_PATH = 260
ERROR_NO_MORE_ITEMS = 259
ERROR_SUCCESS = 0

class FILTER_FULL_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("NextEntryOffset", wintypes.ULONG),
        ("FrameID", wintypes.ULONG),
        ("FilterNameLength", wintypes.ULONG),
        ("FilterNameBuffer", wintypes.WCHAR * MAX_PATH)
    ]

FilterFullInformation = 0  # InformationClass enum

def Win32FromHResult(hr):
    SEVERITY_ERROR = 1
    FACILITY_WIN32 = 7
    def MAKE_HRESULT(sev, fac, code):
        return ((sev << 31) | (fac << 16) | code)
    if (hr & 0xFFFF0000) == MAKE_HRESULT(SEVERITY_ERROR, FACILITY_WIN32, 0):
        return hr & 0xFFFF
    if hr == 0:  # S_OK
        return ERROR_SUCCESS
    return 1  # ERROR_CAN_NOT_COMPLETE

def main():
    ProcessHeap = ctypes.windll.kernel32.GetProcessHeap()
    FilterInformation = ctypes.cast(
        ctypes.windll.kernel32.HeapAlloc(ProcessHeap, 0x00000008, MAX_PATH * ctypes.sizeof(ctypes.c_wchar)),
        ctypes.POINTER(FILTER_FULL_INFORMATION)
    )

    if not FilterInformation:
        print("HeapAlloc failed")
        return

    dwBufferSize = MAX_PATH
    Filter = wintypes.HANDLE()
    FilterFindFirst = fltlib.FilterFindFirst
    FilterFindFirst.argtypes = [ctypes.c_int, ctypes.POINTER(FILTER_FULL_INFORMATION), wintypes.ULONG, ctypes.POINTER(wintypes.ULONG), ctypes.POINTER(wintypes.HANDLE)]
    FilterFindFirst.restype = wintypes.HRESULT

    Result = FilterFindFirst(
        FilterFullInformation,
        FilterInformation,
        dwBufferSize,
        ctypes.byref(wintypes.ULONG(dwBufferSize)),
        ctypes.byref(Filter)
    )

    if Result != 0 or not Filter:
        print("FilterFindFirst failed")
        return

    print(ctypes.wstring_at(FilterInformation.contents.FilterNameBuffer))

    FilterFindNext = fltlib.FilterFindNext
    FilterFindNext.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.POINTER(FILTER_FULL_INFORMATION), wintypes.ULONG, ctypes.POINTER(wintypes.ULONG)]
    FilterFindNext.restype = wintypes.HRESULT

    while True:
        ctypes.memset(FilterInformation, 0, dwBufferSize)
        Result = FilterFindNext(
            Filter,
            FilterFullInformation,
            FilterInformation,
            dwBufferSize,
            ctypes.byref(wintypes.ULONG(dwBufferSize))
        )
        if Result != 0 or not Filter:
            if Win32FromHResult(Result) == ERROR_NO_MORE_ITEMS:
                break
            print("FilterFindNext failed")
            break
        print(ctypes.wstring_at(FilterInformation.contents.FilterNameBuffer))

    fltlib.FilterFindClose(Filter)
    ctypes.windll.kernel32.HeapFree(ProcessHeap, 0, FilterInformation)

if __name__ == "__main__":
    main()
