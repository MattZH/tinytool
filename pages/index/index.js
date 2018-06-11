//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    name: '',
    phone: '',
    needSetLocation: false,
    needSystemLocation: false,
    course: '',
    location: '',
    isCheck: false,
    isLogin: false,
    isBind: true
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    // 登录
    // if (!wx.getStorageSync('session')) {
    //   this.login()
    // } else {
    //   wx.checkSession({
    //     success: () => {
    //       //session_key 未过期，并且在本生命周期一直有效
    //       this.getCourse()
    //     },
    //     fail: () => {
    //       // session_key 已经失效，需要重新执行登录流程
    //       console.log('session_key失效')
    //       this.login() //重新登录
    //     }
    //   })
    // }
  },

  onShow: function () {
    if (!wx.getStorageSync('session')) {
      this.login()
    } else {
      wx.checkSession({
        success: () => {
          //session_key 未过期，并且在本生命周期一直有效
          this.getUser()
          this.getCourse()
          this.setData({
            isLogin: true,
            isBind: true
          })
          this.verifyLocation().then(res => {
            if (res.code == 1) {
              this.setData({
                needSetLocation: false,
                needSystemLocation: true,
                location: ''
              })
              return
            } else if (res.code == 2) {
              this.setData({
                needSetLocation: true,
                needSystemLocation: false,
                location: ''
              })
              return
            }
            this.setData({
              needSetLocation: false,
              needSystemLocation: false,
              location: res.data
            })
          })
        },
        fail: () => {
          // session_key 已经失效，需要重新执行登录流程
          console.log('session_key失效')
          this.login() //重新登录
        }
      })
    }
  },

  onPullDownRefresh: function(){
    // wx.showNavigationBarLoading()
      // wx.hideNavigationBarLoading()
    this.getCourse()
    wx.stopPullDownRefresh()
  },
  login() {
    wx.showLoading({
      title: '登录中',
    })
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        wx.request({
          url: app.globalData.url + '/login',
          method: 'POST',
          data: {
            code: res.code
          },
          success: res => {
            if (res.data.code == 0) {
              setTimeout(() => {
                wx.hideLoading()
                wx.showToast({
                  title: "登陆成功",
                  icon: "success",
                  mask: true,
                })
                setTimeout(() => {
                  wx.setStorage({
                    key: "session",
                    data: res.data.data.session
                  })
                  wx.reLaunch({
                    url: '../../pages/index/index',
                  })
                }, 1500)
              }, 1000)
            } else if (res.data.code == 1003) {
              setTimeout(() => {
                wx.hideLoading()
                this.setData({
                  isBind: false,
                  isLogin: false
                })
                // 判断当前是不是绑定页，防止多次弹出绑定页
                let pages = getCurrentPages()
                if (pages[pages.length - 1].route.indexOf('bind') != -1) {
                  return
                }
                // wx.showToast({
                //   title: res.data.msg,
                //   icon: "none",
                //   mask: false,
                // })
                // setTimeout(() => {
                //   wx.navigateTo({
                //     url: '../../pages/bind/bind',
                //   })
                // }, 1500)
              }, 1000)
            }
          }
        })
      },
      fail: () => {
        console.log('fail')
      },
      timeout: 10000
    })
  },
  getUser() {
    if (wx.getStorageSync('session')) {
      wx.request({
        url: app.globalData.url + '/student',
        method: 'GET',
        header: {
          'session': wx.getStorageSync('session')
        },
        success: res => {
          if (res.data.code == 0) {
            this.setData({
              name: res.data.data.student[0].name,
              phone: res.data.data.student[0].phone
            })
          } else {
            if (res.data.code != 1003) {
              wx.showToast({
                title: res.data.msg,
                icon: 'none',
              })
            }
            setTimeout(() => {
              if (res.data.code == 1001) {
                wx.removeStorageSync('session')
                this.login()
              }
              if (res.data.code == 1003) {
                wx.removeStorageSync('session')
                this.login()
              }
            }, 1500)
          }
        }
      })
    }
  },
  getCourse() {
    if (wx.getStorageSync('session')) {
      // console.log('get course')
      wx.request({
        url: app.globalData.url + '/course',
        header: {
          'session': wx.getStorageSync('session')
        },
        success: res => {
          wx.stopPullDownRefresh()
          if (res.data.code == 0) {
            let course = ''
            if (res.data.data.course.length > 0) {
              course = res.data.data.course[0]
              course.beginTime = util.formatTime(course.beginTime)
              course.endTime = util.formatTime(course.endTime)
              this.setData({
                course: course
              })
              this.getCheckStatus()
            } else {
              this.setData({
                course: ''
              })
            }
            // console.log('课程' + course)
          } else {
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              duration: 2000
            })
            if (res.data.code == 1001) {
              wx.removeStorageSync('session')
              this.login()
            }
          }
        }
      })
    } else {
      wx.stopPullDownRefresh()
      this.login()
    }
  },
  sign() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: "请先绑定身份",
        icon: "none",
        mask: true,
      })
      return
    }
    if (this.data.course == '') {
      wx.showToast({
        title: "现在没有上课，无法签到",
        icon: "none",
        mask: true,
        duration: 3000
      })
      return
    }
    wx.showLoading({
      title: '签到中',
    })
    this.verifyLocation().then(res => {
      if (res.code == 0) {
        wx.request({
          url: app.globalData.url + '/sign',
          method: 'POST',
          header: {
            'session': wx.getStorageSync('session')
          },
          data: {
            latitude: res.data.latitude,
            longitude: res.data.longitude,
          },
          success: res => {
            if (res.data.code == 0) {
              this.setData({
                isCheck: true
              })
              wx.showToast({
                title: '签到成功!',
                icon: 'success',
              })
            } else {
              wx.showToast({
                title: res.data.msg + ' 距离上课地点' + res.data.data.distance + 'm',
                icon: 'none',
              })
            }
          }
        })
      } else {
        if (res.code == 1) {
          this.setData({
            needSetLocation: false,
            needSystemLocation: true,
            location: ''
          })
        } else if (res.code == 2) {
          this.setData({
            needSetLocation: true,
            needSystemLocation: false,
            location: ''
          })
        }
        wx.hideLoading()
      }
    })
  },
  verifyLocation() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: res => {
          if (!res.authSetting['scope.userLocation']) {
            console.log('发起授权')
            wx.authorize({
              scope: 'scope.userLocation',
              success: () => {
                // 用户已经同意小程序使用位置功能，后续调用 wx.startRecord 接口不会弹窗询问
                console.log('授权成功')
                wx.getLocation({
                  type: 'wgs48',
                  success: res => {
                    console.log('获取成功')
                    resolve({
                      code: 0, // 位置获取成功
                      data: res
                    })
                  },
                  fail: () => {
                    console.log('获取位置失败')
                    console.log('请确定手机开启微信定位权限')
                    wx.showToast({
                      title: "请确定手机开启微信定位权限后重新打开小程序",
                      icon: "none",
                      mask: true,
                      duration: 3000
                    })
                    setTimeout(() => {
                      resolve({
                        code: 1, // 微信没有位置权限
                        data: ''
                      })
                    }, 3000)
                  }
                })
              },
              fail: () => {
                console.log('授权失败')
                wx.showToast({
                  title: "签到功能需要获取您的位置，请打开设置",
                  icon: "none",
                  mask: true,
                  duration: 3000
                })
                setTimeout(() => {
                  resolve({
                    code: 2, // 用户拒绝授权
                    data: ''
                  })
                }, 3000)
              }
            })
          } else {
            console.log('已经授权')
            wx.getLocation({
              type: 'wgs84',
              success: (res) => {
                console.log('获取成功')
                resolve({
                  code: 0, // 位置获取成功
                  data: res
                })
              },
              fail: () => {
                console.log('获取位置失败')
                wx.showToast({
                  title: "请确定手机开启微信定位权限后重新打开小程序",
                  icon: "none",
                  mask: true,
                  duration: 3000
                })
                setTimeout(() => {
                  resolve({
                    code: 1, // 微信没有位置权限
                    data: ''
                  })
                }, 3000)
              }
            })
          }
        }
      })
    })
  },
  getCheckStatus() {
    wx.request({
      url: app.globalData.url + '/checkstatus',
      method: 'GET',
      header: {
        'session': wx.getStorageSync('session')
      },
      success: res => {
        if (res.data.code == 0) {
          this.setData({
            isCheck: res.data.data.status
          })
        }
      }
    })
  },
  toBind() {
    wx.navigateTo({
      url: '../../pages/bind/bind',
    })
  }
})
