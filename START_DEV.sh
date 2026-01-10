#!/bin/bash

# Core DNA v2 Development Server Startup

echo "🚀 Starting Core DNA v2 Development Server..."
echo ""

cd "$(dirname "$0")"

# Check for .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found!"
    echo ""
    echo "Setup steps:"
    echo "  1. cp .env.example .env.local"
    echo "  2. Edit .env.local and add your Supabase credentials"
    echo "  3. Run this script again"
    echo ""
    exit 1
fi

# Kill any existing processes
if [ -f ~/coredna-dev.pid ]; then
    kill $(cat ~/coredna-dev.pid) 2>/dev/null
    rm ~/coredna-dev.pid
fi

# Start dev server
npm run dev > ~/coredna-dev.log 2>&1 &
echo $! > ~/coredna-dev.pid

# Wait for server to start
sleep 3

# Display info
echo ""
echo "✅ Core DNA v2 is running!"
echo ""
echo "📍 Open your browser and go to:"
echo "   http://localhost:3000"
echo ""
echo "🔑 First time setup:"
echo "   1. You'll see an API Key prompt"
echo "   2. Go to Settings → API Keys"
echo "   3. Add your LLM provider key (Google, OpenAI, etc.)"
echo ""
echo "🎯 Features available without localhost:"
echo "   ✓ Extract Brand DNA"
echo "   ✓ Battle Mode"
echo "   ✓ Lead Hunter (geolocation)"
echo "   ✓ Campaign Planning"
echo "   ✓ Settings & Preferences"
echo ""
echo "📊 Logs:"
echo "   tail -f ~/coredna-dev.log"
echo ""
echo "🛑 Stop Server:"
echo "   kill \$(cat ~/coredna-dev.pid)"
echo ""
