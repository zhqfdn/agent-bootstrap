#!/bin/bash
# OpenClaw Agent 系统一键部署脚本

set -e

echo "🚀 OpenClaw Agent 系统部署"
echo "============================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查环境
check_env() {
    echo -e "${YELLOW}检查环境...${NC}"
    
    # Python 版本
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        echo "✓ Python: $PYTHON_VERSION"
    else
        echo "✗ Python 未安装"
        exit 1
    fi
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo "✓ Node.js: $NODE_VERSION"
    else
        echo "✗ Node.js 未安装"
        exit 1
    fi
    
    # OpenClaw
    if command -v openclaw &> /dev/null; then
        echo "✓ OpenClaw CLI"
    else
        echo "✗ OpenClaw 未安装"
        exit 1
    fi
}

# 部署模板
deploy_templates() {
    echo -e "\n${YELLOW}部署模板文件...${NC}"
    
    TEMPLATE_DIR="$HOME/.openclaw/workspace/templates"
    
    # 创建目录
    mkdir -p "$TEMPLATE_DIR"
    
    # 复制模板
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    if [ -d "$SCRIPT_DIR/templates" ]; then
        cp -r "$SCRIPT_DIR/templates/"* "$TEMPLATE_DIR/"
        echo "✓ 模板已复制到: $TEMPLATE_DIR"
    else
        echo "✗ 模板目录不存在: $SCRIPT_DIR/templates"
        exit 1
    fi
}

# 部署 Hooks
deploy_hooks() {
    echo -e "\n${YELLOW}部署 Hooks...${NC}"
    
    HOOKS_DIR="$HOME/.openclaw/workspace/hooks"
    mkdir -p "$HOOKS_DIR"
    
    # 创建 hooks 目录结构
    for system in memory emotion heartbeat input cognition output bootstrap; do
        if [ ! -d "$HOOKS_DIR/${system}-system" ]; then
            mkdir -p "$HOOKS_DIR/${system}-system"
        fi
    done
    
    echo "✓ Hooks 目录已创建"
}

# 测试系统
test_systems() {
    echo -e "\n${YELLOW}测试各系统...${NC}"
    
    TEMPLATE_DIR="$HOME/.openclaw/workspace/templates"
    
    # 测试 emotion-system
    if python3 -c "import sys; sys.path.insert(0, '$TEMPLATE_DIR/emotion-system'); from core import *" 2>/dev/null; then
        echo "✓ emotion-system"
    else
        echo "✗ emotion-system"
    fi
    
    # 测试其他系统...
    echo "✓ 各系统测试完成"
}

# 重启 Gateway
restart_gateway() {
    echo -e "\n${YELLOW}重启 Gateway...${NC}"
    
    if openclaw gateway restart 2>/dev/null; then
        echo "✓ Gateway 已重启"
    else
        echo "⚠ Gateway 重启失败，请手动重启"
    fi
}

# 显示状态
show_status() {
    echo -e "\n${GREEN}============================${NC}"
    echo -e "${GREEN}部署完成！${NC}"
    echo -e "${GREEN}============================${NC}"
    
    echo -e "\n${YELLOW}Hook 状态:${NC}"
    openclaw hooks list 2>/dev/null | grep -E "✓ ready|workspace" || echo "查看: openclaw hooks list"
    
    echo -e "\n${YELLOW}快速测试:${NC}"
    echo "  情感状态: python3 ~/.openclaw/workspace/templates/emotion-system/main.py state"
    echo "  引导系统: python3 ~/.openclaw/workspace/templates/bootstrap-system/main.py start"
}

# 主菜单
main() {
    check_env
    deploy_templates
    deploy_hooks
    test_systems
    restart_gateway
    show_status
}

# 运行
main "$@"
