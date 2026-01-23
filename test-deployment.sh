#!/bin/bash

echo "🧪 Testing Your Deployments..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

RENDER_URL="https://impact-esg-deal.onrender.com"
VERCEL_URL="https://gamelab-impact-1byqxe101-gauravs-projects-577c0fb7.vercel.app"

echo "=================================="
echo "1️⃣  TESTING RENDER BACKEND"
echo "=================================="
echo "URL: $RENDER_URL"
echo ""

# Test Render backend
echo -n "Checking if server is alive... "
RENDER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL" --max-time 10)

if [ "$RENDER_STATUS" -eq 200 ] || [ "$RENDER_STATUS" -eq 404 ]; then
    echo -e "${GREEN}✅ Server is responding (Status: $RENDER_STATUS)${NC}"
else
    echo -e "${RED}❌ Server not responding (Status: $RENDER_STATUS)${NC}"
    echo -e "${YELLOW}Note: Free tier takes 30-60s to wake up if inactive${NC}"
fi

echo ""
echo "=================================="
echo "2️⃣  TESTING VERCEL FRONTEND"
echo "=================================="
echo "URL: $VERCEL_URL"
echo ""

# Test Vercel frontend
echo -n "Checking if frontend is live... "
VERCEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL" --max-time 10)

if [ "$VERCEL_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Frontend is live!${NC}"
else
    echo -e "${RED}❌ Frontend not responding (Status: $VERCEL_STATUS)${NC}"
fi

echo ""
echo "=================================="
echo "📋 MANUAL TESTS TO RUN:"
echo "=================================="
echo ""
echo "1. Open your Vercel URL in browser:"
echo "   $VERCEL_URL"
echo ""
echo "2. Open browser console (F12)"
echo "   - Look for any red errors"
echo "   - Check Network tab for failed requests"
echo ""
echo "3. Click 'Test Firebase' button"
echo "   - Should show success alert"
echo ""
echo "4. Try to start a game"
echo "   - Should load without errors"
echo ""
echo "5. Open in TWO different browsers"
echo "   - Test if both can connect"
echo ""
echo "=================================="
echo "🔗 YOUR DEPLOYMENT URLS:"
echo "=================================="
echo ""
echo "Frontend (Vercel):"
echo "  $VERCEL_URL"
echo ""
echo "Backend (Render):"
echo "  $RENDER_URL"
echo ""
echo "=================================="
