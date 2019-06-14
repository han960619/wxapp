import Taro from '@tarojs/taro';
import { sortCartGood } from '../utils/utils'

export default {
  namespace: 'cart',
  state: {
    carts: {},
    whatEver: 0,
  },

  effects: {
  },

  reducers: {
    setAgainCart(state, {payload}) {
      const {id, goods} = payload
      let curCart = state.carts[id]

      !curCart && (curCart = [])
      goods.map(good => {
        if (!curCart.some(item => item.again_id === good.good.again_id)) {
          curCart = sortCartGood(curCart, good.good, good.num)
        }
      })
      state.carts[id] = curCart

      return {...state, whatEver: state.whatEver + 1};
    },
    setCart(state, {payload}) {
      const {id, good, num} = payload
      let curCart = state.carts[id]

      !curCart && (curCart = [])

      if (num >= 1 && good.again_id &&
        curCart.some(item => item.again_id === good.again_id)
      ) {
        return {...state}
      }

      if (good.fs_id) {
        let index = curCart.findIndex(item => item.fs_id === good.fs_id)
        if (index > -1) {
          if (num === 1) {
            Taro.showToast({
              title: '只可以选择一份赠品哦～',
              icon: 'none'
            })
          } else {
            curCart.splice(index, 1)
          }
        } else {
          curCart.push({...good, num})
        }
      } else {
        curCart = sortCartGood(curCart, good, num)

      }

      state.carts[id] = curCart

      return {...state, whatEver: state.whatEver + num};
    },
    setComboCart(state, {payload}) {
      const {id, good, num} = payload
      let curCart = state.carts[id]

      const getGoodOptional = (good)=> {
        let optPrice = good.optional.reduce((total, opt) => {
          let price = opt.list.reduce((t, g) => {
            return t += +g.gn_price * (g.num || 0)
          }, 0)
          return total += price
        }, 0) || 0
        return optPrice
      }

      !curCart && (curCart = [])

      if (num >= 1 && good.again_id &&
        curCart.some(item => item.again_id === good.again_id)
      ) {
        return {...state}
      }

      if (good.fs_id) {
        let index = curCart.findIndex(item => item.fs_id === good.fs_id)
        if (index > -1) {
          if (num >= 1) {
            Taro.showToast({
              title: '只可以选择一份赠品哦～',
              icon: 'none'
            })
          } else {
            curCart.splice(index, 1)
          }
        } else {
          curCart.push({...good, num})
        }
      } else {
        // _num 该商品在购物车中总共多少个
        let _num = curCart.filter(item => item.g_id === good.g_id).reduce((total, opt) => {
          return total += opt.num
        }, 0)

        let goodOver = 0

        // 添加或减少该商品 改变购物车后  该商品的数量  >0超出  <=0未超出
        let _over = _num + num - good.g_limit_num
        console.log(_over)
        console.log(num)
        // 将超出添加操作
        if(_over > 0 && good.g_limit_num > 0 && num > 0) {
          Taro.showToast({
            title: `该折扣商品限购${good.g_limit_num}份，超出则恢复原价`,
            icon: 'none'
          })
          goodOver = 1
        }

        // 减少操作
        if(_over >= 0 && num < 0 && good.g_limit_num > 0) {
          goodOver = -1
        }

        curCart.map((item, index) => item.index = index)
        let idAlikes = curCart.filter(item => item.g_id === good.g_id)
        if (idAlikes.length === 0) {
          good.overNum = 0
          good._total = +good.g_price + getGoodOptional(good)
          curCart.push({...good, num})
        } else {
          let index = idAlikes.findIndex(item => !item.fs_id && (item.optionalnumstr === good.optionalnumstr))
          if (index > -1) {
            let i = idAlikes[index].index
            curCart[i].num += num

            // 限购操作
            curCart[i].overNum = curCart[i].overNum || 0
            if(goodOver == 0) {
              curCart[i]._total += num * (+good.g_price + getGoodOptional(good))
            }else if (goodOver == 1) {
              curCart[i].overNum += 1
              curCart[i]._total += +good.g_original_price + getGoodOptional(good)
            }else if(goodOver == -1) {
              if(_over >= 0) {
                if(curCart[i].overNum > 0) {
                  curCart[i]._total -= +good.g_original_price + getGoodOptional(good)
                }else {
                  curCart[i]._total -= +good.g_price + getGoodOptional(good)
                  for(let j = 0; j < idAlikes.length ; j++) { 
                    if(i != j) {
                      if(idAlikes[j].overNum > 0) {
                        idAlikes[j].overNum -= 1
                        idAlikes[j]._total -= +idAlikes[j].g_original_price - +idAlikes[j].g_price
                      }
                      break;
                    }  
                  } 
                }
              }else if(_over < 0){
                curCart[i]._total -= +good.g_price + getGoodOptional(good)
              }
              curCart[i].overNum = curCart[i].overNum < 1 ? 0 : curCart[i].overNum - 1
            }

            curCart[i].num === 0 && curCart.splice(i, 1)
          } else {
            good.overNum = goodOver
            good._total = (goodOver > 0 ? +good.g_original_price : +good.g_price) + getGoodOptional(good)
            curCart.push({...good, num})
          }
        }
      }

      state.carts[id] = curCart

      return {...state, whatEver: state.whatEver + num};

    },
    clearOneCart(state, {payload}) {
      const {id} = payload
      state.carts[id] = []

      return {...state}
    },
    // 清除满送商品
    clearPresentCart(state, {payload}) {
      const {id} = payload
      state.carts[id] = state.carts[id].filter((item => !item.fs_id))

      return {...state}
    }
  }
}
