#!/bin/bash
# 部署脚本 - 临床试验平台

set -e

echo "==================================="
echo "临床试验平台 - 部署脚本"
echo "==================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未安装Node.js${NC}"
        exit 1
    fi
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}错误: 未安装Python3${NC}"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未安装npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}依赖检查通过${NC}"
}

# 构建前端
build_frontend() {
    echo -e "${YELLOW}构建前端...${NC}"
    
    cd ~/Desktop/OPC/global-clinical-trials-insight-and-commentary-platform-overview
    
    # 安装依赖
    npm install
    
    # 构建
    npm run build
    
    echo -e "${GREEN}前端构建完成${NC}"
}

# 测试后端
test_backend() {
    echo -e "${YELLOW}测试后端...${NC}"
    
    cd ~/Desktop/OPC/global-clinical-trials-insight-and-commentary-platform-overview
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 启动后端
    python src/main.py &
    BACKEND_PID=$!
    
    # 等待启动
    sleep 3
    
    # 测试健康检查
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        echo -e "${GREEN}后端测试通过${NC}"
    else
        echo -e "${RED}后端测试失败${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    # 停止后端
    kill $BACKEND_PID 2>/dev/null
}

# 部署到Render
deploy_render() {
    echo -e "${YELLOW}部署到Render...${NC}"
    
    # 检查render CLI
    if ! command -v render &> /dev/null; then
        echo -e "${YELLOW}安装Render CLI...${NC}"
        brew tap render-ai/render
        brew install render
    fi
    
    # 登录
    render auth login
    
    # 部署
    render blueprint launch
    
    echo -e "${GREEN}Render部署完成${NC}"
}

# 部署到Vercel
deploy_vercel() {
    echo -e "${YELLOW}部署到Vercel...${NC}"
    
    # 检查vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}安装Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    # 登录
    vercel login
    
    # 部署
    vercel --prod
    
    echo -e "${GREEN}Vercel部署完成${NC}"
}

# 主函数
main() {
    echo -e "${GREEN}开始部署流程...${NC}"
    
    # 检查依赖
    check_dependencies
    
    # 构建前端
    build_frontend
    
    # 测试后端
    test_backend
    
    # 选择部署平台
    echo ""
    echo "选择部署平台:"
    echo "1) Render (推荐，免费)"
    echo "2) Vercel (快速，免费)"
    echo "3) 仅本地测试"
    read -p "请选择 (1-3): " choice
    
    case $choice in
        1)
            deploy_render
            ;;
        2)
            deploy_vercel
            ;;
        3)
            echo -e "${GREEN}本地测试完成${NC}"
            echo "启动命令:"
            echo "  后端: python src/main.py"
            echo "  前端: npm run dev"
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}===================================${NC}"
    echo -e "${GREEN}部署完成！${NC}"
    echo -e "${GREEN}===================================${NC}"
}

# 运行主函数
main
