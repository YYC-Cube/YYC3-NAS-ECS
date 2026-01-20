// services/config.js
export const fetchRemoteConfig = async () => {
  const res = await fetch('https://cdn.0379.email/config.json');
  if (!res.ok) throw new Error('配置拉取失败');
  return await res.json();
};
