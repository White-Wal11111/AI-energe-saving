Write-Host "=== 智能建筑节能系统部署测试 ===" -ForegroundColor Cyan
Write-Host "测试时间: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# 测试前端应用
Write-Host "1. 测试前端应用..." -ForegroundColor Green
$FRONTEND_URL = "https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com"
try {
    $response = Invoke-WebRequest -Uri $FRONTEND_URL -Method Get -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 前端应用可访问: $FRONTEND_URL" -ForegroundColor Green
    } else {
        Write-Host "❌ 前端应用返回状态码: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 前端应用不可访问: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试后端API
Write-Host ""
Write-Host "2. 测试后端API..." -ForegroundColor Green
$BACKEND_URL = "https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api/health"
try {
    $response = Invoke-WebRequest -Uri $BACKEND_URL -Method Get -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 后端API可访问: $BACKEND_URL" -ForegroundColor Green
    } else {
        Write-Host "❌ 后端API返回状态码: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 后端API不可访问: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试静态资源
Write-Host ""
Write-Host "3. 测试静态资源..." -ForegroundColor Green
$JS_URL = "https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com/assets/index-DfCSUObQ.js"
$CSS_URL = "https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com/assets/index-CMk5MAha.css"
$IMG_URL = "https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com/bg1.png"

$resources = @(
    @{Name="JavaScript文件"; Url=$JS_URL},
    @{Name="CSS文件"; Url=$CSS_URL},
    @{Name="图片文件"; Url=$IMG_URL}
)

foreach ($resource in $resources) {
    try {
        $response = Invoke-WebRequest -Uri $resource.Url -Method Get -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($resource.Name)可访问" -ForegroundColor Green
        } else {
            Write-Host "❌ $($resource.Name)返回状态码: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($resource.Name)不可访问: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== 部署测试完成 ===" -ForegroundColor Cyan
Write-Host "前端应用: $FRONTEND_URL" -ForegroundColor Yellow
Write-Host "后端API: https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com" -ForegroundColor Yellow
Write-Host "数据库: MySQL (通过环境变量配置)" -ForegroundColor Yellow
Write-Host ""
Write-Host "访问控制台:" -ForegroundColor Cyan
Write-Host "- CloudBase控制台: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/overview" -ForegroundColor Gray
Write-Host "- 云托管服务: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/platform-run" -ForegroundColor Gray
Write-Host "- 静态托管: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/static-hosting" -ForegroundColor Gray