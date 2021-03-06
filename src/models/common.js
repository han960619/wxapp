import Taro from '@tarojs/taro';

import {requestLogin, postUserInfo, requestHomeInfo,
  requestCouponList, postFormId, getUserMobile, getNotice, updateAiPush} from '../services/common';

import amapFile from '../utils/amap-wx'
import {mapKey} from '../config'

export default {
  namespace: 'common',
  state: {
    theme: 1,

    userInfo: {},

    systemInfo: {},

    localInfo: {},

    menu_banner: [],
    menu_cart: {},

    ext: {}
  },

  effects: {
    * requestLogin({}, {put, call, select}) {
      Taro.setStorageSync('stopLogin', 1)
      const wxLoginInfo = yield Taro.login()
      const accOpenid = (yield select(state => state.common)).ext.accOpenid

      const res =  yield call(requestLogin, {
        accOpenid,
        code: wxLoginInfo.code
      })

      Taro.setStorageSync('sessionId', res.sessionId)
      Taro.setStorageSync('idKey', res.idKey)

      Taro.eventCenter.trigger('loginedRequest', {sid: res.sessionId, idkey: res.idKey})
      Taro.removeStorageSync('stopLogin')

      return res
    },
    * postUserInfo({payload}, {put, call}) {
      return yield call(postUserInfo, payload)
    },
    * requestHomeInfo({payload}, {put, call}) {
      return yield call(requestHomeInfo, payload)
    },
    * requestCouponList({payload}, {put, call}) {
      return yield call(requestCouponList, payload)
    },
    * postFormId({payload}, {put, call}) {
      return yield call(postFormId, payload)
    },
    * getUserMobile({payload}, {put, call}) {
      return yield call(getUserMobile, payload)
    },
    * getNotice({payload}, {put, call}) {
      return yield call(getNotice, payload)
    },
    * updateAiPush({payload}, {put, call}) {
      return yield call(updateAiPush, payload)
    },
    * getSetLocalInfo({}, {put, call}) {
      const getRegeo  = () => {
        return new Promise((resolve, reject) => {
          const myAmapFun = new amapFile.AMapWX({key: mapKey})
          myAmapFun.getRegeo({
            // location: '107.97,26.58',
            success(data) {
              if (!data || !data[0] || !data[0].regeocodeData || !data[0].regeocodeData.addressComponent
              ||!data[0].regeocodeData.addressComponent.city || !data[0].regeocodeData.addressComponent.province) {
                reject({error: '位置信息错误'})
                return
              }
              let addressInfo = data[0].regeocodeData.addressComponent
              let locationCity;
              if (typeof addressInfo.city === 'string') {
                locationCity = addressInfo.city.replace('市', '')
              } else {
                locationCity = addressInfo.province.replace('市', '')
              }
              let district = addressInfo.district
              let location = addressInfo.streetNumber.location

              let longitude = '', latitude = '';

              if (location) {
                [longitude, latitude] = location.split(',')
                resolve({location, longitude, latitude, locationCity, district})
              } else {
                Taro.getLocation().then(res => {
                  let {latitude, longitude} = res
                  resolve({location, longitude, latitude, locationCity, district})
                })
              }

            },
            fail(err) {
              reject(err)
            }
          })
        })
      }

      const localInfo = yield getRegeo().then(res => res).catch(err => ({error: 1, err}))
      if (localInfo.error === 1) {
        Taro.showToast({
          title: '获取定位失败',
          icon: 'none'
        })

        if (localInfo.err && localInfo.err.errCode == 0 && localInfo.err.errMsg.indexOf('auth') > -1) {
          let timer = setTimeout(() => {
            clearTimeout(timer)
            Taro.reLaunch({
              url: '/pages/auth-setting/index'
            })
          }, 1500)
        }

      }
      yield put({
        type: 'setLocalInfo',
        payload: {localInfo}
      })

      return
    },

    * initRequest ({}, {put, call}) {

      const data = yield call(requestHomeInfo)

      Taro.setStorageSync('themeInfo', JSON.stringify(data))

      const {menu_banner, menu_cart, bottom_logo, b_logo, b_bottom_content, b_bottom_status, full_logo_goods, ...indexState} = data
      yield put({
        type: 'setThemeInfo',
        payload: {menu_banner, menu_cart, theme: data.style_color || 1, bottom_logo, b_logo, b_bottom_content, b_bottom_status, full_logo_goods}
      })

      return indexState
    }

  },

  reducers: {
    setUserInfo(state, {payload}) {
      Taro.setStorageSync('userInfo', {real: payload, time: new Date().getTime()})
      let userInfo = {}
      if (payload.userInfo !== undefined) {
        userInfo = payload
      } else {
        userInfo = {userInfo: {}}
      }
      return {...state, userInfo};
    },
    setSistemInfo(state, {payload}) {
      return {...state, systemInfo: payload};
    },
    setLocalInfo(state, {payload}) {
      return {...state, ...payload};
    },
    setThemeInfo(state, {payload}) {
      return {...state, ...payload};
    },
    setExt(state, {payload}) {
      return {...state, ext: payload};
    },
},

  subscriptions: {
    setup() {

    }
  }

};
