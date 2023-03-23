// 引入请求模块
import axios from 'axios'
import guard_dog from 'guard_dog'
import { minxin } from '../config'

// 加载这个模块的时候给 ACCESS_TOKEN 这个键名初始化
guard_dog.init('ACCESS_TOKEN', async (handler) => {
  const corpid = minxin.corpid
  const corpsecret = minxin.corpsecret
  const url = minxin.url
  const requestUrl = `${url}gettoken?corpid=${corpid}&corpsecret=${corpsecret}`
  //  获取access_token
  const response = await axios.get(requestUrl)
  const accessToken = response.data.access_token
  const expiresIn = response.data.expires_in
  handler(accessToken, expiresIn)
})
// 只要向外暴露一个获取值的方法就可以了
export function access_token(callback: any): void {
  guard_dog.get('ACCESS_TOKEN', callback)
}
