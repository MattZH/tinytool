// pages/bind/bind.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    phone: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  onShow: function () {
    console.log(getCurrentPages())
  },

  setName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  setPhone: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },

  bind() {
    if (this.data.name == '') {
      wx.showToast({
        title: '请输入姓名',
        icon: "none",
        mask: true,
        duration: 2000,
      })
      return
    }
    if (this.data.phone == '') {
      wx.showToast({
        title: '请输入手机号',
        icon: "none",
        mask: true,
        duration: 2000,
      })
      return
    }
    wx.showLoading({
      title: '绑定中',
    })
    wx.login({
      success: res => {
        wx.request({
          url: app.globalData.url + '/bind',
          method: 'POST',
          data: {
            name: this.data.name,
            phone: this.data.phone,
            code: res.code
          },
          success: (res) => {
            wx.hideLoading()
            if (res.data.code == 0) {
              wx.setStorage({
                key: "session",
                data: res.data.data.session
              })
              wx.showToast({
                title: '绑定成功',
                icon: "success",
                mask: true,
              })
              setTimeout(() => {
                wx.navigateBack({
                  delta: 1
                })
              }, 1500)
            } else {
              wx.showToast({
                title: res.data.msg,
                icon: "none",
                mask: true,
              })
            }
          }
        })
      }
    })
  }
})