# ZerithDB Python SDK — Troubleshooting Guide

This guide covers common installation and setup issues for the `zerithdb-python` SDK, with
platform-specific solutions for Windows, macOS and Linux.

---

## Table of Contents

- [Failed to build `aiortc`](#failed-to-build-aiortc)
  - [Why this happens](#why-this-happens)
  - [Fix on Windows](#fix-on-windows)
  - [Fix on macOS](#fix-on-macos)
  - [Fix on Linux (Ubuntu / Debian)](#fix-on-linux-ubuntu--debian)
  - [Fix on Linux (Fedora / RHEL / CentOS)](#fix-on-linux-fedora--rhel--centos)
  - [Fix on Linux (Arch)](#fix-on-linux-arch)
  - [Verify your installation](#verify-your-installation)
- [pip install fails with `No matching distribution found`](#pip-install-fails-with-no-matching-distribution-found)
- [SSL / Certificate errors during install](#ssl--certificate-errors-during-install)
- [ImportError after install](#importerror-after-install)
- [Still stuck?](#still-stuck)

---

## Failed to build `aiortc`

### Error log (typical)

```
ERROR: Failed building wheel for aiortc
      ...
      Could not find the ffmpeg libraries. Make sure you have installed ffmpeg.
      error: command '/usr/bin/gcc' failed with exit code 1

  ERROR: Failed to build one or more wheels
```

or on Windows:

```
error: Microsoft Visual C++ 14.0 or greater is required.
...
Failed to build aiortc av
```

### Why this happens

`aiortc` (the WebRTC library used by ZerithDB Python) depends on
[PyAV](https://github.com/PyAV-Org/PyAV), which in turn requires **`ffmpeg`** (or `libav`) native
media libraries to be present on your system **before** the Python package is compiled from source.

If `pip` cannot find a pre-built wheel for your platform/Python version, it falls back to building
from source and that build will fail unless `ffmpeg` development headers are installed.

---

### Fix on Windows

**Option A : Install ffmpeg via winget (Windows 10/11)**

```powershell
winget install ffmpeg
```

Restart your terminal after installation, then re-run `pip install zerithdb`.

**Option B : Install ffmpeg via Chocolatey**

```powershell
# Run PowerShell as Administrator
choco install ffmpeg
```

**Option C : Manual install**

1. Download a Windows build from <https://www.gyan.dev/ffmpeg/builds/> (choose the `full_build`
   zip).
2. Extract it, e.g. to `C:\ffmpeg`.
3. Add `C:\ffmpeg\bin` to your **System PATH** (Control Panel → System → Advanced → Environment
   Variables → `Path`).
4. Open a **new** terminal and verify:

```powershell
ffmpeg -version
```

**Also required: Microsoft Visual C++ Build Tools**

If you see `Microsoft Visual C++ 14.0 or greater is required`, install the free
[Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and
select the **"Desktop development with C++"** workload.

---

### Fix on macOS

**Recommended: Homebrew**

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install ffmpeg
brew install ffmpeg
```

**Verify:**

```bash
ffmpeg -version
# Should print something like: ffmpeg version 7.x ...
```

Then reinstall the Python package:

```bash
pip install --upgrade zerithdb
```

---

### Fix on Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install -y ffmpeg libavcodec-dev libavformat-dev libavdevice-dev \
                    libavutil-dev libswscale-dev libswresample-dev pkg-config
```

---

### Fix on Linux (Fedora / RHEL / CentOS)

Enable the RPM Fusion repository first (required for ffmpeg on RHEL-based distros):

```bash
sudo dnf install -y https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm
sudo dnf install -y ffmpeg ffmpeg-devel
```

---

### Fix on Linux (Arch)

```bash
sudo pacman -Syu ffmpeg
```

---

### Verify your installation

After installing ffmpeg, confirm that Python can find the libraries:

```bash
ffmpeg -version          # Should print version info
python -c "import av; print(av.__version__)"   # Should not raise ImportError
pip install zerithdb     # Re-run install
```

If `import av` still fails after installing ffmpeg, try rebuilding PyAV from source:

```bash
pip install --upgrade --no-binary av av
```

---

## pip install fails with `No matching distribution found`

```
ERROR: Could not find a version that satisfies the requirement zerithdb (from versions: none)
ERROR: No matching distribution found for zerithdb
```

**Causes & fixes:**

| Cause                         | Fix                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| Python version too old        | ZerithDB requires Python **3.9+**. Run `python --version` and upgrade if needed.                  |
| Using `pip` from Python 2     | Use `pip3` or `python3 -m pip` explicitly.                                                        |
| Corporate proxy blocking PyPI | Set `HTTP_PROXY` / `HTTPS_PROXY` env vars, or use `pip install --trusted-host pypi.org zerithdb`. |

---

## SSL / Certificate errors during install

```
SSLError: HTTPSConnectionPool ... certificate verify failed
```

**Quick fix (not recommended for production):**

```bash
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org zerithdb
```

**Proper fix:** Update your system's CA certificates:

- **Ubuntu/Debian:** `sudo apt install -y ca-certificates && sudo update-ca-certificates`
- **macOS:** Update via System Settings → Software Update.
- **Windows:** Run Windows Update, or install the
  [DigiCert root cert](https://www.digicert.com/kb/digicert-root-certificates.htm) manually.

---

## ImportError after install

```python
>>> import zerithdb
ImportError: cannot import name 'ZerithClient' from 'zerithdb'
```

This usually means a **stale or partial install**. Fix with:

```bash
pip uninstall zerithdb -y
pip cache purge
pip install zerithdb
```

If you're using a virtual environment, make sure it's activated:

```bash
# Create and activate (Linux/macOS)
python -m venv .venv
source .venv/bin/activate

# Create and activate (Windows)
python -m venv .venv
.venv\Scripts\activate
```

---

## Still stuck?

1. **Search existing issues** :- <https://github.com/Zerith-Labs/ZerithDB/issues>
2. **Open a new issue** :- include your OS, Python version (`python --version`), pip version
   (`pip --version`) and the full error traceback.
3. **Join the community Discord** :- <https://discord.gg/MhvuDvzWfF>

→ **We're happy to help!**
