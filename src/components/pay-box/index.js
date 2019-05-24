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
      return true
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

  render () {
    let {theme, carts, onOpenCart, themeInfo, simple, totalPrice, btnText, active} = this.props
    const {isAlert} = this.state
    let noMust = this.filterBtnText()
    return (
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
            <Text>&yen;</Text>
            <Text className='font-xin-normal'>
              {
                totalPrice ||
                (carts.reduce((total, good) => {
                  if (!good.optionalnumstr) {
                    let price = good.g_price * good.num
                    good.optional && (price +=
                      good.optional.reduce((t, item, i) => {
                        return t += +item.list[good.optionalTagIndex[i]].gn_price * good.num
                      }, 0))
                    good.num && (total += +price)
                  } else {
                    total += (good.total_price * good.num)
                  }
                  return total
                }, 0)).toFixed(2)
              }
            </Text>
          </View>
        </View>
        
        <IdButton className={classnames('theme-grad-bg-' + theme)} noMust={noMust && btnText == '去支付'} onClick={this.handleClick}>{btnText == '去支付' ? (!noMust ? btnText : '请选择必选品') : btnText}</IdButton>

        <AtToast
          isOpened={isAlert} text={'您还未添加商品哦～'} iconSize={40} duration={2000}
          icon='shopping-bag-2' hasMask onClose={this.closeAlert}
        />

      </View>
    )
  }
}

export default PayBox
