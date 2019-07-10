import Taro, {Component} from '@tarojs/taro'
import {View, Text, Image} from '@tarojs/components'
import {connect} from '@tarojs/redux'
import classnames from 'classnames'
import {AtToast} from 'taro-ui'
import IdButton from '../../components/id-button'
import '../../app.less'

import './index.less'

@connect(({common, shop}) => ({...common, ...shop}))
class PayBox extends Component {

  static defaultProps = {
    carts: [],
    themeInfo: {},
    totalPrice: null,
    btnText: '去支付',
    onClick: null
  }

  state = {
    isAlert: false
  }

  toPostOrder = () => {
    if (this.props.carts.length === 0) {
      this.openAlert()
      return
    }
    let url = '/pages/post-order/index?store_id=' + this.props.storeId
    if (this.props.present) {
      url += ('&type=' + 'present')
    }
    Taro.navigateTo({
      url
    })
  }

  openAlert = () => {
    this.setState({isAlert: true})
  }

  closeAlert = () => {
    this.setState({isAlert: false})
  }

  handleClick = () => {
    if (this.props.onClick) {
      this.props.onClick()
    } else {
      if(this.filterBtnText()) {
        this.props.onTop()
        return
      }
      this.props.onPay()
      this.toPostOrder()
    }
  }

  filterBtnText = () => {
    let { carts, mustList } = this.props
    let equalList = []
    if(mustList.length == 0) {
      return false
    }
    for(let i = 0; i < mustList.length; i++) {
      for(let j = 0; j < carts.length; j++) {
        if(mustList[i].g_id == carts[j].g_id) {
          equalList.push(mustList[i])
        }
      }
    }

    return equalList.length <= 0
  }

  filterWarnText = () => {
    let warnText = ''
    let discount = 0
    let { carts, fullDiscount, totalPrice } = this.props
    let total = totalPrice ||
    (carts.reduce((total, good) => {
      // if (!good.optionalnumstr) {
      //   let price = good.g_price * good.num
      //   good.optional && (price +=
      //     good.optional.reduce((t, item, i) => {
      //       return t += +item.list[good.optionalTagIndex[i]].gn_price * good.num
      //     }, 0))
      //   good.num && (total += +price)
      // } else {
      //   total += (good.total_price * good.num)
      // }
      // return total
      return total += good._total
    }, 0)).toFixed(2)
    
    for(let i = 0; i < fullDiscount.length; i++) {
      if(total - fullDiscount[0].f < 0) {
        warnText = `满${fullDiscount[0].f}减${fullDiscount[0].d}，还差${(fullDiscount[0].f - total).toFixed(2)}元`;
        break;
      }else if(total - fullDiscount[fullDiscount.length - 1].f >= 0){
        discount = fullDiscount[fullDiscount.length - 1].d
        warnText = `已减${fullDiscount[fullDiscount.length - 1].d}元`;
        break;
      }else if(total == fullDiscount[i].f) {
        discount = fullDiscount[i].d
        warnText = `已减${fullDiscount[i].d}元，再凑${(fullDiscount[i + 1].f - total).toFixed(2)}元减${fullDiscount[i+ 1].d}元`;
        break;
      }else if(total - fullDiscount[i].f < 0) {
        discount = fullDiscount[i - 1].d
        warnText = `已减${fullDiscount[i - 1].d}元，再凑${(fullDiscount[i].f - total).toFixed(2)}元减${fullDiscount[i].d}元`;
        break;
      }
    }

    return { warnText, discount }
  }

  filterShowWarn = () => {
    let cartsWarn = true
    let { carts, fullDiscount } = this.props
    carts.map((item) => {
      if(item.g_original_price > item.g_price || fullDiscount.length == 0 || item.fs_id) {
        cartsWarn = false
      }
    })
    return cartsWarn
  }

  render () {
    let {theme, carts, onOpenCart, themeInfo, simple, totalPrice, btnText, active, isShowCart, s_business} = this.props
    const {isAlert} = this.state
    let cartsWarn = this.filterShowWarn()
    let { warnText, discount } = this.filterWarnText()
    let showMust = this.filterBtnText()
    let price = totalPrice ||
    (carts.reduce((total, good) => {
      // if (!good.optionalnumstr) {
      //   let price = good.g_price * good.num
        
      //   good.optional && (price +=
      //     good.optional.reduce((t, item, i) => {
      //       return t += +item.list[good.optionalTagIndex[i]].gn_price * good.num
      //     }, 0))
      //   good.num && (total += +price)
      // } else {
      //   total += (good.total_price * good.num)
      // }
      // return total
      return total += good._total
    }, 0)).toFixed(2)
    return (
      s_business == 1 ?
      <View className={`pay-content ${(carts.length > 0 || active) ? 'active' : ''}`}>
        <View className={classnames('pay-box', (carts.length > 0 || active) ? 'active' : '', simple ? 'simple' : '')}>
          <View className='info' onClick={onOpenCart}>
            <Image src={themeInfo.image} />
            {
              carts.length && !totalPrice &&
              <View
                className='badge' style={{color: themeInfo.text_color, backgroundColor: themeInfo.background_color}}
              >
                {
                  carts.reduce((total, good) => {
                    return total += good.num
                  }, 0)
                }
              </View>
            }
            <View className='price'>
              <Text className='yen' style={{ fontSize: '28rpx'}}>&yen;</Text>
              <Text className='font-xin-normal'>
                {
                  cartsWarn ? (price - discount).toFixed(2) : price
                }
              </Text>
            </View>
            {
              cartsWarn && discount != 0 &&
              <View className='pre-price'>
                <Text className='yen' style={{ fontSize: '21rpx'}}>&yen;</Text>
                <Text className='font-xin-normal'>{price}</Text>
              </View>
            }
          </View>
          
          <IdButton className={classnames('theme-grad-bg-' + theme)} showMust={showMust && btnText == '去支付'} onClick={this.handleClick}>{btnText == '去支付' ? (!showMust ? btnText : '请选择必选品') : btnText}</IdButton>

          <AtToast
            isOpened={isAlert} text={'您还未添加商品哦～'} iconSize={40} duration={2000}
            icon='shopping-bag-2' hasMask onClose={this.closeAlert}
          />
        </View>
        <View className="a">
          {
            !isShowCart &&
            <View className={classnames('box-warn', (cartsWarn && carts.length != 0) ? 'active' : '')}>
              <View className='text-content'>{warnText}</View>
            </View>
          }
        </View>
      </View>
      :  <View className='pay-content active'>
          <View className='pay-box active'>
            <View className='close-store'>
              <Image src={themeInfo.image} />
              <View className='close-desc'>本店休息中，下次再来吧~</View>
            </View>
          </View>
        </View>
    )
  }
}

export default PayBox
