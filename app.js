const { login } = require('./utils/request')

App({
  globalData: {
    appName: '故媛工作室',
    themeColor: '#b7472a'
  },

  onLaunch() {
    login().catch(function (err) {
      console.log('[静默登录失败]', err)
    })
  }
})
