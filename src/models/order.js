import Taro from '@tarojs/taro'

import {getOrderList, getOrderDetail, getPreOrderInfo, getReserveTime,
  requestSaveOrder, requestPayOrder, getOrderPayStatus, requestCancelOrder,
  requestOrderRepeat} from '../services/order'

export default {
  namespace: 'order',
  state: {
    curAddress: {},
    couponOptions: [],
    curCouponIndex: 0,

    refreshAddress: false
  },

  effects: {
    * getOrderList({payload}, {put, call}) {
      return yield call(getOrderList, payload)
    },
    * getOrderDetail({payload}, {put, call}) {
      return yield call(getOrderDetail, payload)
    },
    * getPreOrderInfo({payload}, {put, call}) {
      return yield call(getPreOrderInfo, payload)
    },
    * getReserveTime({payload}, {put, call}) {
      return yield call(getReserveTime, payload)
    },
    * requestSaveOrder({payload}, {put, call}) {
      return yield call(requestSaveOrder, payload)
    },
    * requestPayOrder({payload}, {put, call}) {
      return yield call(requestPayOrder, payload)
    },
    * getOrderPayStatus({payload}, {put, call}) {
      let res = yield call(getOrderPayStatus, payload)
      if (!res) {
        let res = yield put(getOrderPayStatus, payload)
      }
      return res
    },
    * requestCancelOrder({payload}, {put, call}) {
      return yield call(requestCancelOrder, payload)
    },
    * requestOrderRepeat({payload}, {put, call}) {
      let {change, goods} = yield call(requestOrderRepeat, payload)
      const {store_id, order_id} = payload

      let warnText = '商品规格属性已变更'

      goods.forEach((good, index) => {
        if(good.g_limit > 1) {
          change = true
          goods = []
          warnText = '订单包含特殊限购商品'
        }
      });

      yield put({
        type: 'repeatOrderAddCart',
        payload: {store_id, order_id, goods}
      })

      if (change) {
        return {change, warnText, payload: {store_id, order_id, goods}}
      } else {
        Taro.navigateTo({
          url: '/pages/shop-index/index?id=' + store_id + '&showcart=1'
        })
        return {change, warnText}
      }
    },
    * repeatOrderAddCart({payload}, {put}) {
      const {store_id, order_id, goods} = payload

      const cartGoods = goods.map((good, index) => {

        let {propertyTagIndex, optionalTagIndex, optionalnumstr} = good

        if (optionalnumstr) {
          if (optionalnumstr.length === 0) {
            delete good.optionalnumstr
            if (optionalTagIndex && optionalTagIndex.length > 0) {
              good.optionalTagIndex = optionalTagIndex.map(item => +item)
            }

            if (optionalTagIndex && optionalTagIndex.length > 0 || propertyTagIndex && propertyTagIndex.length > 0) {
              good.optionalstr = propertyTagIndex.join('') + optionalTagIndex.join('')
            }
          } else {
            delete good.optionalTagIndex

            good.optionalnumstr = optionalnumstr[0]

            good.optional.map((opt, _i) => {
              opt.list.map((g, i) => {
                let preSelectedGood = good.od_optional_array.find(od => od.parent_id === opt.parent_id).list[g.gn_id]
                return g.num = preSelectedGood ? preSelectedGood.gn_num : 0
              })
            })

            let optPrice = good.optional.reduce((total, opt) => {
              let price = opt.list.reduce((t, g) => {
                return t += +g.gn_price * (g.num || 0)
              }, 0)
              return total += price
            }, 0) || 0

            good.total_price = +good.g_price + optPrice
          }
        }

        good.again_id = order_id + '-' + good.g_id + '-' + index

        const {od_optional_array, od_property_array, ...useGood} = good;

        return {
          id: +store_id,
          good: {...useGood, order_id},
          num: good.od_num
        }

      })

      var b = []//记录数组a中的id 相同的下标
      for(var i = 0; i < cartGoods.length;i++){
          for(var j = cartGoods.length-1;j>i;j--){
              if(cartGoods[i].good.g_id == cartGoods[j].good.g_id){
                  cartGoods[i].num = cartGoods[i].num*1 + cartGoods[j].num*1
                  cartGoods[i].good.od_num = (cartGoods[i].good.od_num*1 + cartGoods[j].good.od_num*1).toString()
                  b.push(j)
              }
          }
      }
      
      for(var k = 0; k<b.length;k++){
        delete cartGoods[b[k]]
      }

      yield put({
        type: 'cart/setAgainCart',
        payload: {
          goods: cartGoods,
          id: +store_id,
        }
      })

      return cartGoods
    }
  },

  reducers: {
    setKeyRefreshAddress(state, {payload}) {
      return {...state, ...payload}
    },
    setCouponOptions(state, {payload}) {
      return {...state, ...payload}
    },
    setCouponIndex(state, {payload}) {
      return {...state, ...payload}
    },
  }
}
