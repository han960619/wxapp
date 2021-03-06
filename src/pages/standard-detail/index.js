import Taro, {Component} from '@tarojs/taro'
import {View, Text, ScrollView, Image} from '@tarojs/components'
import {connect} from '@tarojs/redux'
import classnames from 'classnames'
import PayBox from '../../components/pay-box'
import Numbox from '../../components/num-box'

import './index.less'


@connect(({common}) => ({...common}))
class StandardDetail extends Component {

  config = {
    navigationBarTitleText: '套餐详情',
    disableScroll: true
  }

  state = {
    g_description: '',
    g_image: null,
    fixed: [],
    optional: [],
    intoViewId: null
  }

  componentWillMount() {
    this.getGoodNorm()
  }

  getGoodNorm = () => {
    this.props.dispatch({
      type: 'shop/getGoodsNorm',
      payload: {
        store_id: +this.$router.params.store_id,
        goods_id: +this.$router.params.id
      }
    }).then(({g_description, g_image, norm: {fixed, optional}}) => {
      this.setState({g_description, g_image, fixed, optional})
    })
  }

  selectOther = (index, i, num) => {
    const opt = this.state.optional[index]
    const totalNum = opt.list.reduce((total, item) => {
      return total += (item.num || 0)
    }, 0)

    if (totalNum >= opt.gn_num && num === 1) {
      Taro.showToast({
        title: '超出可选最大数量',
        icon: 'none'
      })

      return
    }
    const good = opt.list[i]
    !good.num && (good.num = 0)
    good.num += num

    this.setState({optional: this.state.optional})
  }

  addCart = () => {
    const {id, store_id, fs_id} = this.$router.params
    const {fixed, optional, g_image} = this.state

    let noFull = false
    try {
      optional.forEach((op) => {
        let curnum = op.list.reduce((t, gn) => {
          return t += (gn.num || 0)
        }, 0)

        if (curnum < op.gn_num) {
          Taro.showToast({
            title: `你还可以选择${op.gn_num - curnum}份${op.title}哦～`,
            icon: 'none'
          })

          this.setState({intoViewId: 'id-' + op.parent_id})

          noFull = true
          throw new Error('no full')
        }
      })
    } catch (err) {

    }


    if (noFull) return


    const optionalnumstr = optional.reduce((total, op) => {
      let curarr = []
      op.list.forEach((gd) => {
        curarr.push(gd.num || 0)
      })
      total.push(curarr.join('|'))
      return total
    }, []).join(',') || ' '

    const good = {
      g_id: +id,
      num: 1,
      fixed,
      optional,
      optionalnumstr,
      total_price: this.optPrice + (+this.$router.params.g_price || 0),
      g_image,
      g_title: this.$router.params.name,
      fs_id: +fs_id
    }
    this.props.dispatch({
      type: 'cart/setComboCart',
      payload: {
        id: store_id,
        good,
        num: 1,
      }
    })

    Taro.navigateBack()
  }

  render() {
    const {theme, menu_cart} = this.props
    const {g_description, g_image, fixed, optional, intoViewId} = this.state

    const g_price = +this.$router.params.g_price || 0

    this.optPrice = optional.reduce((total, opt) => {
      let price = opt.list.reduce((t, good) => {
        return t += +good.gn_price * (good.num || 0)
      }, 0)
      return total += price
    }, 0) || 0

    return (
      g_description &&
      <View>
        <ScrollView className='standard-detail' scrollY scrollWithAnimation scrollIntoView={intoViewId}>
          <View className='content'>
            <View className='banner'>
              <Image src={g_image}/>
            </View>
            <View className='title'>{g_description}</View>
            <View className='goods'>
              <View className='goods-title'>已选商品</View>
              {
                fixed.map((good, index) => (
                  <View className='goods-item' key={index}>
                    <Image className='pic' src={good.gn_image}/>
                    <View className='info'>
                      <View className='name'>{good.gn_name}</View>
                      <View className='standard'>{good.gn_append}</View>
                    </View>
                    <View className='num'>x{good.gn_num}份</View>
                  </View>
                ))
              }
            </View>
            {
              optional.map((opt, index) => (
                <View className='goods' key={index} id={'id-' + opt.parent_id}>
                  <View className='goods-title'>请选择{opt.title}{opt.gn_num}份</View>
                  {
                    opt.list && opt.list.map((good, i) => (
                      <View className='others-item' key={i}>
                        <Image className='pic' src={good.gn_image}/>
                        <View className='info'>
                          <View className='name'>{good.gn_name}</View>
                          <View className='standard'>{good.gn_append}</View>
                          <View className='price'>加&yen;
                            <Text className='font-xin-normal'>{good.gn_price}</Text>
                          </View>
                        </View>

                        <View className='num-wrap'>
                          <Numbox
                            num={good.num}
                            showNum={good.num && good.num > 0}
                            onReduce={this.selectOther.bind(this, index, i, -1)}
                            onAdd={this.selectOther.bind(this, index, i, 1)}
                          />
                        </View>
                      </View>
                    ))
                  }
                </View>
              ))

            }
          </View>

        </ScrollView>
        <View className='pay-wrap'>
          <PayBox
            active onClick={this.addCart}
            theme={theme}
            totalPrice={((g_price || 0) + this.optPrice).toFixed(2)} storeId={+this.$router.params.id}
            themeInfo={menu_cart} btnText='选好了'
          />
        </View>
      </View>
    )
  }
}

export default StandardDetail
