#!/usr/bin/env python3
"""
Workspace Validation Script
Verifies that the development environment is properly configured
"""

import sys
from pathlib import Path
from typing import Dict


def check_python_version() -> bool:
    """Check if Python version is 3.9+"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 9:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        py_ver = f"{version.major}.{version.minor}.{version.micro}"
        print(f"❌ Python {py_ver} (requires 3.9+)")
        return False


def check_vscode_config() -> Dict[str, bool]:
    """Check VS Code configuration files"""
    vscode_dir = Path(".vscode")
    required_files = {
        "tasks.json": vscode_dir / "tasks.json",
        "settings.json": vscode_dir / "settings.json",
        "launch.json": vscode_dir / "launch.json",
        "extensions.json": vscode_dir / "extensions.json",
        "snippets/python.json": vscode_dir / "snippets" / "python.json",
    }

    results = {}
    for name, path in required_files.items():
        if path.exists():
            print(f"✅ {name}")
            results[name] = True
        else:
            print(f"❌ {name} (missing)")
            results[name] = False

    return results


def check_project_structure() -> Dict[str, bool]:
    """Check project directory structure"""
    required_dirs = ["src", "tests", ".vscode", ".vscode/snippets"]

    required_files = [
        "requirements.txt",
        "README.md",
        "DEVELOPMENT.md",
        ".gitignore",
        "bitsacco-bot.code-workspace",
    ]

    results = {}

    # Check directories
    for dir_name in required_dirs:
        path = Path(dir_name)
        if path.exists() and path.is_dir():
            print(f"✅ Directory: {dir_name}/")
            results[f"dir_{dir_name}"] = True
        else:
            print(f"❌ Directory: {dir_name}/ (missing)")
            results[f"dir_{dir_name}"] = False

    # Check files
    for file_name in required_files:
        path = Path(file_name)
        if path.exists() and path.is_file():
            print(f"✅ File: {file_name}")
            results[f"file_{file_name}"] = True
        else:
            print(f"❌ File: {file_name} (missing)")
            results[f"file_{file_name}"] = False

    return results


def check_dependencies() -> bool:
    """Check if requirements.txt exists and is readable"""
    req_file = Path("requirements.txt")
    if not req_file.exists():
        print("❌ requirements.txt not found")
        return False

    try:
        with open(req_file, "r", encoding="utf-8") as f:
            deps = f.read().strip().split("\n")
            deps = [d.strip() for d in deps if d.strip() and not d.startswith("#")]
            print(f"✅ Found {len(deps)} dependencies in requirements.txt")
            return True
    except Exception as e:
        print(f"❌ Error reading requirements.txt: {e}")
        return False


def check_git_setup() -> bool:
    """Check git configuration"""
    git_dir = Path(".git")
    gitignore = Path(".gitignore")

    git_ok = git_dir.exists() and git_dir.is_dir()
    gitignore_ok = gitignore.exists() and gitignore.is_file()

    if git_ok:
        print("✅ Git repository initialized")
    else:
        print("❌ Git repository not initialized")

    if gitignore_ok:
        print("✅ .gitignore file exists")
    else:
        print("❌ .gitignore file missing")

    return git_ok and gitignore_ok


def main():
    """Run all validation checks"""
    print("🔍 Validating Bitsacco Bot Workspace Configuration")
    print("=" * 60)

    checks = {
        "Python Version": check_python_version(),
        "VS Code Config": all(check_vscode_config().values()),
        "Project Structure": all(check_project_structure().values()),
        "Dependencies": check_dependencies(),
        "Git Setup": check_git_setup(),
    }

    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)

    all_passed = True
    for check_name, passed in checks.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{check_name:<20} {status}")
        if not passed:
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("🎉 ALL CHECKS PASSED! Workspace is ready for development.")
        print("\n💡 Next steps:")
        print("   1. Open bitsacco-bot.code-workspace in VS Code")
        print("   2. Install recommended extensions when prompted")
        print("   3. Create and activate virtual environment")
        print("   4. Install dependencies: pip install -r requirements.txt")
        print("   5. Copy .env.example to .env and configure")
        print("   6. Run tests: Ctrl+Shift+P → 'Tasks: Run Task' → " "'🧪 Run Tests'")
        sys.exit(0)
    else:
        print("❌ SOME CHECKS FAILED! Please fix issues before proceeding.")
        sys.exit(1)


if __name__ == "__main__":
    main()
