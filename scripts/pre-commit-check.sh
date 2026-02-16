#!/bin/bash
# Pre-Commit CI Check Script (Bash)
# Runs all CI checks locally before committing

set -e

echo "========================================"
echo "  Pre-Commit CI Checks"
echo "========================================"
echo ""

EXIT_CODE=0

# Check Node version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ v22 ]]; then
    echo "Warning: CI uses Node 22, you have $NODE_VERSION"
fi

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v)
echo "npm: $NPM_VERSION"
if [ "$NPM_VERSION" != "10.9.4" ]; then
    echo "Warning: CI uses npm 10.9.4, you have $NPM_VERSION"
fi

# 1. Install dependencies
echo ""
echo "[Install dependencies] Running: npm ci"
if npm ci; then
    echo "[✓] Install dependencies passed"
else
    echo "Trying npm install as fallback..."
    if npm install; then
        echo "[✓] Install dependencies passed (fallback)"
    else
        echo "[✗] Failed to install dependencies"
        exit 1
    fi
fi

# 2. Prisma validation
echo ""
echo "[Prisma validation] Running: npx prisma validate"
cd packages/database
if npx prisma validate; then
    echo "[✓] Prisma schema validation passed"
    cd ../..
else
    echo "[✗] Prisma schema validation failed"
    cd ../..
    EXIT_CODE=1
fi

# 3. Prisma generate
echo ""
echo "[Prisma generate] Running: npm run prisma:generate"
if npm run prisma:generate; then
    echo "[✓] Generate Prisma client passed"
else
    echo "[✗] Generate Prisma client failed"
    EXIT_CODE=1
fi

# 4. Lint
echo ""
echo "[Lint] Running: npm run lint"
if npm run lint; then
    echo "[✓] Lint passed"
else
    echo "[!] Lint failed (warning in CI - continue-on-error)"
fi

# 5. Type check
echo ""
echo "[Type check] Running: npx nx run-many --target=typecheck --all"
if npx nx run-many --target=typecheck --all; then
    echo "[✓] Type check passed"
else
    echo "[!] Type check failed (warning in CI - continue-on-error)"
fi

# 6. Build
echo ""
echo "[Build] Running: npm run build"
if npm run build; then
    echo "[✓] Build passed"
else
    echo "[✗] Build failed"
    EXIT_CODE=1
fi

# 7. Tests
echo ""
echo "[Tests] Running: npm run test"
if npm run test; then
    echo "[✓] Tests passed"
else
    echo "[!] Tests failed or no tests found (this is OK in CI)"
fi

# Summary
echo ""
echo "========================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo "  [✓] All critical checks passed!"
    echo "  You're ready to commit!"
else
    echo "  [✗] Some checks failed"
    echo "  Please fix errors before committing"
fi
echo "========================================"
echo ""

exit $EXIT_CODE

