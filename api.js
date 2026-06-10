// 基金数据 API 集成模块
class FundDataAPI {
    constructor() {
        this.cache = new Map();
        this.cacheExpire = 5 * 60 * 1000; // 5分钟缓存
    }

    // ===== 方案1: 天天基金 API =====
    async fetchFromTianTianFund(fundCode) {
        try {
            // 天天基金实时数据接口
            const url = `https://fundgz.1234567890.com.cn/js/${fundCode}.js`;
            
            const response = await fetch(url);
            const text = await response.text();
            
            // 解析返回的数据
            // 格式: jsonpgz({"name":"基金名","code":"000001","gsz":"1.5234"...})
            const matched = text.match(/jsonpgz\((.*)\)/);
            if (!matched) return null;
            
            const data = JSON.parse(matched[1]);
            
            return {
                code: fundCode,
                name: data.name,
                currentPrice: parseFloat(data.gsz),
                dayChange: parseFloat(data.gztime && data.gsz ? (data.gsz - data.dwjz) / data.dwjz * 100 : 0),
                source: 'TianTianFund',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('天天基金 API 错误:', error);
            return null;
        }
    }

    // ===== 方案2: 新浪财经 API =====
    async fetchFromSinaFinance(fundCode) {
        try {
            // 新浪财经基金数据接口
            const url = `https://hq.sinajs.cn/?list=f_${fundCode}&rn=${Math.random()}`;
            
            const response = await fetch(url);
            const text = await response.text();
            
            // 解析格式: var hq_str_f_000001="基金名,当前价,涨跌幅,涨跌额,日期,时间"
            const matched = text.match(/="([^"]*)"/) || text.match(/='([^']*)'/);
            if (!matched) return null;
            
            const parts = matched[1].split(',');
            if (parts.length < 3) return null;
            
            return {
                code: fundCode,
                name: parts[0],
                currentPrice: parseFloat(parts[1]),
                dayChange: parseFloat(parts[2]),
                source: 'SinaFinance',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('新浪财经 API 错误:', error);
            return null;
        }
    }

    // ===== 方案3: 腾讯行情 API =====
    async fetchFromTencentStock(fundCode) {
        try {
            // 腾讯行情基金数据接口
            const url = `https://qt.gtimg.com/q=f${fundCode}&callback=QhData`;
            
            const response = await fetch(url);
            const text = await response.text();
            
            // 解析腾讯格式的数据
            // 格式: QhData={"f_code":"000001","f_name":"基金名"...}
            const matched = text.match(/=({.*})/);
            if (!matched) return null;
            
            const data = JSON.parse(matched[1]);
            
            return {
                code: fundCode,
                name: data.f_name || data.name,
                currentPrice: parseFloat(data.f_price || data.price),
                dayChange: parseFloat(data.f_change || 0),
                source: 'TencentStock',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('腾讯行情 API 错误:', error);
            return null;
        }
    }

    // ===== 智能查询：尝试多个数据源 =====
    async fetchFundData(fundCode) {
        // 检查缓存
        if (this.cache.has(fundCode)) {
            const cached = this.cache.get(fundCode);
            if (Date.now() - cached.time < this.cacheExpire) {
                return cached.data;
            }
        }

        console.log(`正在查询基金 ${fundCode}...`);

        // 依次尝试三个数据源
        let result = null;

        // 首先尝试天天基金（最准确）
        console.log('尝试天天基金数据源...');
        result = await this.fetchFromTianTianFund(fundCode);
        if (result) {
            this.cache.set(fundCode, { data: result, time: Date.now() });
            return result;
        }

        // 其次尝试新浪财经
        console.log('尝试新浪财经数据源...');
        result = await this.fetchFromSinaFinance(fundCode);
        if (result) {
            this.cache.set(fundCode, { data: result, time: Date.now() });
            return result;
        }

        // 最后尝试腾讯行情
        console.log('尝试腾讯行情数据源...');
        result = await this.fetchFromTencentStock(fundCode);
        if (result) {
            this.cache.set(fundCode, { data: result, time: Date.now() });
            return result;
        }

        console.error(`无法获取基金 ${fundCode} 的数据`);
        return null;
    }

    // ===== 批量查询多个基金 =====
    async fetchMultipleFunds(fundCodes) {
        const results = await Promise.all(
            fundCodes.map(code => this.fetchFundData(code))
        );
        return results.filter(r => r !== null);
    }

    // ===== 获取基金列表（用于搜索） =====
    async searchFunds(keyword) {
        // 这个函数可以连接真实的基金搜索API
        // 目前返回模拟数据，后续可以集成真实搜索
        console.log('搜索基金:', keyword);
        
        // TODO: 集成基金搜索 API
        // 可以使用天天基金的搜索接口或其他数据源
        
        return [];
    }

    // ===== 清除缓存 =====
    clearCache() {
        this.cache.clear();
        console.log('缓存已清除');
    }

    // ===== 获取缓存状态 =====
    getCacheStatus() {
        return {
            size: this.cache.size,
            items: Array.from(this.cache.keys())
        };
    }
}

// 创建全局 API 实例
const fundAPI = new FundDataAPI();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FundDataAPI, fundAPI };
}
