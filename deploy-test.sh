#!/bin/bash

echo "=== 智能建筑节能系统部署测试 ==="
echo "测试时间: $(date)"
echo ""

# 测试前端应用
echo "1. 测试前端应用..."
FRONTEND_URL="https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com"
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    echo "✅ 前端应用可访问: $FRONTEND_URL"
else
    echo "❌ 前端应用不可访问"
fi

# 测试后端API
echo ""
echo "2. 测试后端API..."
BACKEND_URL="https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api/health"
if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL" | grep -q "200"; then
    echo "✅ 后端API可访问: $BACKEND_URL"
else
    echo "❌ 后端API不可访问"
fi

# 测试静态资源
echo ""
echo "3. 测试静态资源..."
JS_URL="https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com/assets/index-DfCSUObQ.js"
CSS_URL="https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com/assets/index-CMk5MAha.css"
IMG_URL="https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com/bg1.png"

if curl -s -o /dev/null -w "%{http_code}" "$JS_URL" | grep -q "200"; then
    echo "✅ JavaScript文件可访问"
else
    echo "❌ JavaScript文件不可访问"
fi

if curl -s -o /dev/null -w "%{http_code}" "$CSS_URL" | grep -q "200"; then
    echo "✅ CSS文件可访问"
else
    echo "❌ CSS文件不可访问"
fi

if curl -s -o /dev/null -w "%{http_code}" "$IMG_URL" | grep -q "200"; then
    echo "✅ 图片文件可访问"
else
    echo "❌ 图片文件不可访问"
fi

echo ""
echo "=== 部署测试完成 ==="
echo "前端应用: $FRONTEND_URL"
echo "后端API: https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com"
echo "数据库: MySQL (通过环境变量配置)"
echo ""
echo "访问控制台:"
echo "- CloudBase控制台: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/overview"
echo "- 云托管服务: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/platform-run"
echo "- 静态托管: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/static-hosting"