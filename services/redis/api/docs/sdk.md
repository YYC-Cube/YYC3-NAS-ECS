# 🧰 RediOps API SDK 使用说明

本 SDK 封装了所有核心接口，便于前端调用与统一错误处理。

---

## 📦 安装方式

````bash
npm install @yyc3/api-sdk

🔐 登录

import { login } from '@yyc3/api-sdk';

const res = await login({ email, password });
if (res.code === 0) {
  // 登录成功，保存 token
  localStorage.setItem('token', res.data.token);
} else {
  // 登录失败，处理错误
  console.error(res.message);
}

👤 获取用户信息

import { getUserInfo } from '@yyc3/api-sdk';

const res = await getUserInfo(token);
if (res.code === 0) {
  // 获取用户信息成功，处理数据
  console.log(res.data);
} else {
  // 获取用户信息失败，处理错误
  console.error(res.message);
}

✏️ 修改用户信息

import { updateUser } from '@yyc3/api-sdk';

const res = await updateUser({ name: 'Yu' }, token);
if (res.code === 0) {
  // 修改用户信息成功，处理数据
  console.log(res.data);
} else {
  // 修改用户信息失败，处理错误
  console.error(res.message);
}

🚪 注销登录

import { logout } from '@yyc3/api-sdk';

const res = await logout(token);
if (res.code === 0) {
  // 注销登录成功，清除 token
  localStorage.removeItem('token');
} else {
  // 注销登录失败，处理错误
  console.error(res.message);
}

所有接口均返回统一结构：{ code, message, data }


---

## 📊 2. 接口调用统计模块（每日 PV/UV）

### ✅ 建表语句：`api_stats`

```sql
CREATE TABLE IF NOT EXISTS api_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL COMMENT '接口路径',
  date DATE NOT NULL COMMENT '统计日期',
  pv INT DEFAULT 0 COMMENT '访问次数',
  uv INT DEFAULT 0 COMMENT '独立用户数',
  UNIQUE KEY (endpoint, date)
);


✅ 更新逻辑（伪代码）

// 每次请求后调用
await stats.incrementPV(endpoint);
await stats.incrementUV(endpoint, user_id);

✅ 可配合定时任务每日归档，支持图表展示与趋势分析

🧩 3. 远程配置编辑器（可视化修改配置）
✅ 前端建议：React + JSON Editor

import JSONEditor from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';

const RemoteConfigEditor = () => {
  const [config, setConfig] = useState({});

  useEffect(() => {
    fetch('https://cdn.0379.email/config.json')
      .then(res => res.json())
      .then(setConfig);
  }, []);

  const handleSave = () => {
    fetch('/admin/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  };

  return (
    <div>
      <JSONEditor value={config} onChange={setConfig} />
      <button onClick={handleSave}>保存配置</button>
    </div>
  );
};

✅ 后端需提供 /admin/config/update 接口，支持权限校验与版本归档
````
