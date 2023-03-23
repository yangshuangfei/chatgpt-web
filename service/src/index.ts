import { debug } from 'console'
import express from 'express'
import jwt from 'jsonwebtoken'
import { expressjwt } from 'express-jwt'
// 引入请求模块
import axios from 'axios'
import logger from 'morgan'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'
import { minxin } from './config'
import { access_token } from './utils/access_token'

const secretKey = 'abdbdodjod-^-^-'
const app = express()
const router = express.Router()

app.use(logger('dev'))
app.use(express.static('public'))
app.use(express.json())
app.use(
  expressjwt({ secret: secretKey, algorithms: ['HS256'] }).unless({ path: ['/session', '/login'] }),
) // /匹配的内容/ ^不在\转义/api/

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  next()
})

router.post('/chat-process', [limiter], async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    debug('123333', req)
    const { prompt, options = {}, systemMessage } = req.body as RequestProps
    let firstChunk = true
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { code } = req.body as { code: string }
    if (!code)
      throw new Error('Secret key is empty')
    // 用户信息对象 密钥 有效期
    const tokenStr = jwt.sign(
      { username: code }, secretKey, { expiresIn: '3h' },
    )
    res.send({ status: 'Success', message: 'Verify successfully', data: tokenStr })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { code } = req.body as { code: string }
    if (!code)
      throw new Error('Secret key is empty')
    // 用户信息对象 密钥 有效期
    let userid: string = null
    access_token(async (data) => {
      if (data) {
        const url = minxin.url
        // 根据access_token和用户code获取用户基本信息
        const response1 = await axios.get(`${url}auth/getuserinfo?access_token=${data}&code=${code}`)
        userid = response1.data.userid
      }
    })

    if (userid == null || userid === undefined)
      throw new Error('获取用户信息失败')

    const tokenStr = jwt.sign(
      { username: userid }, secretKey, { expiresIn: '2h' },
    )
    res.send({ status: 'Success', message: 'Verify successfully', data: tokenStr })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

app.use('', router)
app.use('/api', router)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
