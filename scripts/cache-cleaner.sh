#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

VERSION="2.0.0"
CLEAN_LOG="$PROJECT_ROOT/.cache-cleaner.log"

COLORS_ENABLED=true
FORCE_MODE=false
DRY_RUN=false
VERBOSE=false
CACHE_SIZE_BEFORE=0
CACHE_SIZE_AFTER=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

declare -A CACHE_CONFIG
declare -A CACHE_SIZES

init_cache_config() {
    CACHE_CONFIG[node_modules]="依赖包目录|高|true|true"
    CACHE_CONFIG[.vite]="Vite 构建缓存|中|true|true"
    CACHE_CONFIG[.cache]="通用缓存目录|中|true|true"
    CACHE_CONFIG[.turbo]="Turbopack 缓存|中|true|true"
    CACHE_CONFIG[dist]="构建输出目录|低|false|true"
    CACHE_CONFIG[build]="构建输出目录|低|false|true"
    CACHE_CONFIG[coverage]="测试覆盖率报告|低|false|true"
    CACHE_CONFIG[.next]="Next.js 缓存|中|true|true"
    CACHE_CONFIG[.nuxt]="Nuxt.js 缓存|中|true|true"
    CACHE_CONFIG[node_modules/.cache]="Node 模块缓存|低|true|true"
    CACHE_CONFIG[npm-debug.log]="npm 调试日志|低|false|false"
}

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] $message" >> "$CLEAN_LOG"
    
    case $level in
        INFO)  color=$CYAN ;;
        SUCCESS) color=$GREEN ;;
        WARNING) color=$YELLOW ;;
        ERROR) color=$RED ;;
        *) color=$NC ;;
    esac
    
    if $COLORS_ENABLED; then
        echo -e "${color}$message${NC}"
    else
        echo "$message"
    fi
}

get_directory_size() {
    local path=$1
    if [ -d "$path" ]; then
        du -sm "$path" 2>/dev/null | cut -f1 || echo "0"
    else
        echo "0"
    fi
}

format_size() {
    local size=$1
    if [ "$size" -ge 1024 ]; then
        echo "$((size / 1024)) GB"
    elif [ "$size" -ge 1 ]; then
        echo "${size} MB"
    else
        echo "${size} KB"
    fi
}

calculate_total_size() {
    local total=0
    for path in "${!CACHE_SIZES[@]}"; do
        total=$((total + CACHE_SIZES[$path]))
    done
    echo $total
}

scan_cache() {
    log INFO "扫描缓存文件..."
    
    local found_count=0
    
    for path in "${!CACHE_CONFIG[@]}"; do
        local full_path="$PROJECT_ROOT/$path"
        
        if [ -e "$full_path" ]; then
            local size=$(get_directory_size "$full_path")
            CACHE_SIZES[$path]=$size
            found_count=$((found_count + 1))
            
            local desc=$(echo "${CACHE_CONFIG[$path]}" | cut -d'|' -f1)
            local priority=$(echo "${CACHE_CONFIG[$path]}" | cut -d'|' -f2)
            
            if [ "$size" -gt 0 ]; then
                log INFO "  $path - $(format_size $size) - $desc (优先级: $priority)"
            else
                log INFO "  $path - $(format_size $size) - $desc"
            fi
        fi
    done
    
    if [ "$found_count" -eq 0 ]; then
        log INFO "未发现缓存文件"
    else
        log INFO "发现 $found_count 个缓存目录/文件"
    fi
}

clean_cache_item() {
    local path=$1
    local full_path="$PROJECT_ROOT/$path"
    local desc=$(echo "${CACHE_CONFIG[$path]}" | cut -d'|' -f1)
    
    if $DRY_RUN; then
        log INFO "[干运行] 将删除: $path ($desc)"
        return 0
    fi
    
    if [ -d "$full_path" ]; then
        if rm -r "$full_path" 2>/dev/null; then
            log SUCCESS "已删除: $path ($desc)"
            return 0
        else
            log ERROR "删除失败: $path (权限不足)"
            return 1
        fi
    elif [ -f "$full_path" ]; then
        if rm -f "$full_path" 2>/dev/null; then
            log SUCCESS "已删除: $path ($desc)"
            return 0
        else
            log ERROR "删除失败: $path (权限不足)"
            return 1
        fi
    fi
}

clean_all_caches() {
    local cleaned_count=0
    local failed_count=0
    
    log INFO "开始清理缓存..."
    
    for path in "${!CACHE_CONFIG[@]}"; do
        if [ -e "$PROJECT_ROOT/$path" ]; then
            if clean_cache_item "$path"; then
                cleaned_count=$((cleaned_count + 1))
            else
                failed_count=$((failed_count + 1))
            fi
        fi
    done
    
    log SUCCESS "清理完成: $cleaned_count 个项目，失败 $failed_count 个"
}

clean_npm_cache() {
    if $DRY_RUN; then
        log INFO "[干运行] 将清理 npm 缓存"
        return 0
    fi
    
    log INFO "清理 npm 缓存..."
    
    if command -v npm &> /dev/null; then
        if npm cache clean --force 2>/dev/null; then
            log SUCCESS "npm 缓存清理完成"
        else
            log WARNING "npm 缓存清理失败 (可能需要修复权限)"
            log INFO "运行: sudo chown -R $(whoami):$(id -gn) ~/.npm"
        fi
    else
        log WARNING "npm 未安装，跳过"
    fi
}

clean_yarn_cache() {
    if $DRY_RUN; then
        log INFO "[干运行] 将清理 Yarn 缓存"
        return 0
    fi
    
    log INFO "清理 Yarn 缓存..."
    
    if command -v yarn &> /dev/null; then
        local yarn_cache_dir=$(yarn cache dir 2>/dev/null || echo "$HOME/.yarn/cache")
        
        if [ -d "$yarn_cache_dir" ]; then
            if rm -r "$yarn_cache_dir" 2>/dev/null; then
                log SUCCESS "Yarn 缓存清理完成"
            else
                log ERROR "Yarn 缓存清理失败"
            fi
        fi
    else
        log WARNING "Yarn 未安装，跳过"
    fi
}

clean_pnpm_cache() {
    if $DRY_RUN; then
        log INFO "[干运行] 将清理 pnpm 缓存"
        return 0
    fi
    
    log INFO "清理 pnpm 缓存..."
    
    if command -v pnpm &> /dev/null; then
        if pnpm store prune 2>/dev/null; then
            log SUCCESS "pnpm 缓存清理完成"
        else
            log WARNING "pnpm 缓存清理失败"
        fi
    else
        log WARNING "pnpm 未安装，跳过"
    fi
}

clean_docker_cache() {
    if $DRY_RUN; then
        log INFO "[干运行] 将清理 Docker 缓存"
        return 0
    fi
    
    log INFO "清理 Docker 缓存..."
    
    if command -v docker &> /dev/null; then
        if docker system prune -f 2>/dev/null; then
            log SUCCESS "Docker 缓存清理完成"
        else
            log WARNING "Docker 缓存清理失败 (可能未运行或无权限)"
        fi
    else
        log WARNING "Docker 未安装，跳过"
    fi
}

clean_git_cache() {
    if $DRY_RUN; then
        log INFO "[干运行] 将清理 Git 垃圾"
        return 0
    fi
    
    log INFO "清理 Git 垃圾..."
    
    if [ -d "$PROJECT_ROOT/.git" ]; then
        if git -C "$PROJECT_ROOT" gc --aggressive --prune=now 2>/dev/null; then
            log SUCCESS "Git 垃圾清理完成"
        else
            log WARNING "Git 垃圾清理失败"
        fi
    else
        log WARNING "非 Git 仓库，跳过"
    fi
}

clean_typescript_cache() {
    if $DRY_RUN; then
        log INFO "[干运行] 将清理 TypeScript 缓存"
        return 0
    fi
    
    log INFO "清理 TypeScript 缓存..."
    
    local tsbuildinfo_count=$(find "$PROJECT_ROOT" -name "*.tsbuildinfo" -type f 2>/dev/null | wc -l)
    
    if [ "$tsbuildinfo_count" -gt 0 ]; then
        if find "$PROJECT_ROOT" -name "*.tsbuildinfo" -type f -delete 2>/dev/null; then
            log SUCCESS "删除 $tsbuildinfo_count 个 TypeScript 缓存文件"
        else
            log WARNING "TypeScript 缓存清理失败"
        fi
    else
        log INFO "未发现 TypeScript 缓存文件"
    fi
}

show_statistics() {
    CACHE_SIZE_BEFORE=$(calculate_total_size)
    
    echo ""
    log INFO "=== 缓存统计 ==="
    log INFO "总大小: $(format_size $CACHE_SIZE_BEFORE)"
    
    if [ "$CACHE_SIZE_BEFORE" -gt 0 ]; then
        echo ""
        log INFO "按大小排序:"
        
        for path in "${!CACHE_SIZES[@]}"; do
            echo "${CACHE_SIZES[$path]}|$path"
        done | sort -rn | head -10 | while IFS='|' read -r size path; do
            if [ "$size" -gt 0 ]; then
                local desc=$(echo "${CACHE_CONFIG[$path]}" | cut -d'|' -f1)
                log INFO "  $(format_size $size) - $path ($desc)"
            fi
        done
    fi
}

show_summary() {
    CACHE_SIZE_AFTER=$(calculate_total_size)
    local freed=$((CACHE_SIZE_BEFORE - CACHE_SIZE_AFTER))
    
    echo ""
    log INFO "=== 清理总结 ==="
    log SUCCESS "已释放: $(format_size $freed)"
    log INFO "剩余缓存: $(format_size $CACHE_SIZE_AFTER)"
    
    if [ "$freed" -gt 0 ]; then
        local percentage=$((freed * 100 / CACHE_SIZE_BEFORE))
        log SUCCESS "释放比例: ${percentage}%"
    fi
    
    if [ -f "$CLEAN_LOG" ]; then
        log INFO "详细日志: $CLEAN_LOG"
    fi
}

show_menu() {
    clear
    cat << EOF
╔═════════════════════════════════════════════════════════════╗
║           YYC³ 缓存清理工具 v$VERSION                      ║
╚═════════════════════════════════════════════════════════════╝

  1. 扫描缓存
  2. 清理所有缓存
  3. 清理 npm 缓存
  4. 清理 Yarn 缓存
  5. 清理 pnpm 缓存
  6. 清理 Docker 缓存
  7. 清理 Git 垃圾
  8. 清理 TypeScript 缓存
  9. 自定义清理
  0. 退出

  选项: [--dry-run] [--force] [--no-color] [--verbose]

EOF
}

custom_clean() {
    echo ""
    echo "可用的缓存目录:"
    echo ""
    
    local i=1
    declare -A CACHE_MENU_KEYS
    for path in "${!CACHE_CONFIG[@]}"; do
        local desc=$(echo "${CACHE_CONFIG[$path]}" | cut -d'|' -f1)
        local size=${CACHE_SIZES[$path]:-0}
        echo "  $i. $path - $(format_size $size) - $desc"
        CACHE_MENU_KEYS[$i]=$path
        i=$((i + 1))
    done
    
    echo ""
    read -p "选择要清理的项目 (多个用空格分隔): " choices
    
    if [ -z "$choices" ]; then
        log WARNING "未选择任何项目"
        return 1
    fi
    
    echo ""
    read -p "确认删除? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
        log INFO "操作已取消"
        return 0
    fi
    
    for choice in $choices; do
        if [ -n "${CACHE_MENU_KEYS[$choice]}" ]; then
            clean_cache_item "${CACHE_MENU_KEYS[$choice]}"
        fi
    done
}

show_help() {
    cat << EOF
YYC³ 缓存清理工具 v$VERSION

用法: $0 [选项]

选项:
  -h, --help          显示帮助信息
  -v, --version       显示版本信息
  -d, --dry-run       干运行模式，只显示将要删除的内容
  -f, --force         强制模式，跳过确认
  -n, --no-color      禁用彩色输出
  -V, --verbose       详细输出模式

示例:
  $0                  # 交互式菜单
  $0 --scan          # 仅扫描缓存
  $0 --clean-all      # 清理所有缓存
  $0 --dry-run       # 干运行模式
  $0 --force --clean-all  # 强制清理所有缓存

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                echo "YYC³ 缓存清理工具 v$VERSION"
                exit 0
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE_MODE=true
                shift
                ;;
            -n|--no-color)
                COLORS_ENABLED=false
                shift
                ;;
            -V|--verbose)
                VERBOSE=true
                shift
                ;;
            --scan)
                init_cache_config
                scan_cache
                show_statistics
                exit 0
                ;;
            --clean-all)
                init_cache_config
                scan_cache
                show_statistics
                
                if ! $FORCE_MODE; then
                    read -p "确认清理所有缓存? (yes/no): " confirm
                    if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
                        log INFO "操作已取消"
                        exit 0
                    fi
                fi
                
                clean_all_caches
                clean_npm_cache
                clean_docker_cache
                clean_git_cache
                clean_typescript_cache
                
                show_summary
                exit 0
                ;;
            *)
                log ERROR "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

interactive_mode() {
    init_cache_config
    scan_cache
    show_statistics
    
    while true; do
        show_menu
        read -p "请选择操作: " choice
        
        case $choice in
            1)
                clear
                init_cache_config
                scan_cache
                show_statistics
                ;;
            2)
                clear
                if ! $FORCE_MODE; then
                    read -p "确认清理所有缓存? (yes/no): " confirm
                    if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
                        continue
                    fi
                fi
                clean_all_caches
                show_summary
                ;;
            3)
                clear
                clean_npm_cache
                ;;
            4)
                clear
                clean_yarn_cache
                ;;
            5)
                clear
                clean_pnpm_cache
                ;;
            6)
                clear
                clean_docker_cache
                ;;
            7)
                clear
                clean_git_cache
                ;;
            8)
                clear
                clean_typescript_cache
                ;;
            9)
                clear
                custom_clean
                show_summary
                ;;
            0|q|Q)
                log INFO "退出"
                exit 0
                ;;
            *)
                log ERROR "无效选择"
                ;;
        esac
        
        echo ""
        read -p "按 Enter 继续..."
    done
}

main() {
    parse_arguments "$@"
    interactive_mode
}

main "$@"
