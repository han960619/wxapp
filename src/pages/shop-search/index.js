import Taro, {Component} from '@tarojs/taro'
import {View, Text, Image, Swiper, SwiperItem, ScrollView, Block} from '@tarojs/components'
import { AtIcon, AtInput } from 'taro-ui'
import {connect} from '@tarojs/redux'
import classnames from 'classnames'
import Modal from '../../components/modal'
import PayBox from '../../components/pay-box'
import Numbox from '../../components/num-box'
import Curtain from '../../components/curtain'
import './index.less'
import IdButton from "../../components/id-button/index"
import noListPng from '../../assets/images/noList.png'
@connect(({common, cart, shop}) => ({...common, ...cart, ...shop}))
class ShopSearch extends Component {

  config = {
    navigationBarTitleText: '商品搜索',
  }

  state = {
    group: null,
    isShowCart: false,
		isShowDetail: false,
		filterList: null,
		curCart: {},
		curGood: {},
		propertyTagIndex: [],
		optionalTagIndex: [],
		stanInfo: {},
    isShowOptions: false,
    keyword: ''
  }

  componentWillMount() {
    const { group } = this.props
    let goodsList = []
    group.map((item) => {
      goodsList = goodsList.concat(item.goods_list)
    })
    this.setState({
      goodsList: [...goodsList],
    })
  }

  filterGoods = () => {
    const { keyword, goodsList } = this.state
    let filterList = goodsList.filter(item => item.g_title.includes(keyword))
    this.setState({
			filterList
    })
  }

  ToggleShowCart = () => {
    this.setState({isShowCart: !this.state.isShowCart})
  }

  closeCart = () => {
    this.setState({isShowCart: false})
  }

  showDetail = (good) => {
    const carts = this.props.carts[(+this.$router.params.id)] || []
    const curCart = JSON.parse(JSON.stringify(carts.find(item => item.g_id === good.g_id) || {}))


    this.setState({
      isShowDetail: true,
      curGood: good,
      curCart
    })
  }

  closeDetail = () => {
    this.setState({isShowDetail: false})
  }

  openOptions = (good, e) => {
    e && e.stopPropagation()

    this.setState({
      isShowCart: false,
      curGood: good,
    })
    Taro.showNavigationBarLoading()
    this.props.dispatch({
      type: 'shop/getGoodsNorm',
      payload: {
        store_id: +this.$router.params.id,
        goods_id: good.g_id
      }
    }).then(res => {
      const propertyTagIndex = Array.from({length: res.property.length}, () => 0)
      const optionalTagIndex = Array.from({length: res.norm.optional.length}, () => 0)

      const carts = this.props.carts[(+this.$router.params.id)] || []
      const optionalstr = propertyTagIndex.join('') + optionalTagIndex.join('')
      const cartsAlike = carts.find(item => (
        !item.fs_id &&
        (item.g_id === good.g_id) && (item.optionalstr === optionalstr)
      ))
      const curCart = JSON.parse(JSON.stringify(cartsAlike || {}))

      this.setState({
        isShowOptions: true,
        stanInfo: res,
        curCart,
        propertyTagIndex,
        optionalTagIndex,
      }, Taro.hideNavigationBarLoading)

    })
  }

  closeOptions = () => {
    this.setState({
      isShowOptions: false,
      stanInfo: {}
    })
  }
  
  handleTop = () => {
    Taro.setStorage({ key: 'scroll', data: true })
    .then(() => {
      Taro.navigateBack()
    })
  }

  selectTag = (key, index, i) => {

    let stan = this.state[key]
    stan[index] = i
    this.setState({[key]: stan}, this.setCurCart)
  }

  setCurCart = () => {
    const {propertyTagIndex, optionalTagIndex, curGood} = this.state

    const carts = this.props.carts[(+this.$router.params.id)] || []
    const optionalstr = propertyTagIndex.join('') + optionalTagIndex.join('')
    const cartsAlike = carts.find(item => (
      (item.g_id === curGood.g_id) && (item.optionalstr === optionalstr)
    ))
    const curCart = JSON.parse(JSON.stringify(cartsAlike || {}))

    this.setState({curCart})
  }

  toChooseStan = () => {
    this.setState({isShowDetail: false})
    this.openOptions(this.state.curGood)
  }

  setCart = (good, num, cartGood) => {
    if (num === -1 && (!cartGood.num || cartGood.num <= 0)) return

    this.props.dispatch({
      type: 'cart/setCart',
      payload: {
        id: +this.$router.params.id,
        good: {
          ...good,
          again_id: undefined,
        },
        num
      }
    })

    this.setCurCart()
  }

  setComboCart = (good, num) => {
    this.props.dispatch({
      type: 'cart/setComboCart',
      payload: {
        id: +this.$router.params.id,
        good: {
          ...good,
          again_id: undefined,
        },
        num
      }
    })
    this.setCurCart()
  }


  setLocalCart = num => {
    const {curGood, stanInfo, propertyTagIndex, optionalTagIndex} = this.state
    const curCart = JSON.parse(JSON.stringify(this.state.curCart))
    !curCart.num && (curCart.num = 0)
    curCart.num += num
    curCart.optionalstr = propertyTagIndex.join('') + optionalTagIndex.join('')
    this.setState({curCart})

    let normInfo = {}
    if (stanInfo.property) {
      normInfo = {
        property: JSON.parse(JSON.stringify(stanInfo.property)),
        optional: JSON.parse(JSON.stringify(stanInfo.norm.optional)),
        propertyTagIndex: JSON.parse(JSON.stringify(propertyTagIndex)),
        optionalTagIndex: JSON.parse(JSON.stringify(optionalTagIndex)),
        optionalstr: propertyTagIndex.join('') + optionalTagIndex.join(''),
      }
    }

    const good = {
      ...curGood,
      ...curCart,
      ...normInfo
    }

    this.props.dispatch({
      type: 'cart/setCart',
      payload: {
        id: +this.$router.params.id,
        good,
        num
      }
    })
  }

  clearCart = () => {
    this.props.dispatch({
      type: 'cart/clearOneCart',
      payload: {
        id: +this.$router.params.id,
      }
    })
    this.setState({
      isShowCart: false,
      // isShowCartWarn: false,
      isShowOptions: false,
      isShowDetail: false
    })
  }

  toStandardDetail = (good) => {
    this.setState({isShowDetail: false})
    Taro.navigateTo({
      url: `/pages/standard-detail/index?store_id=${this.$router.params.id}&id=${good.g_id}&name=${good.g_title}&g_price=${good.g_price}&g_original_price=${good.g_original_price}&g_limit_num=${good.g_limit_num}`
    })
  }

  stopPropagation = e => {
    e.stopPropagation()
  }

  handlePay = () => {
    this.setState({
      isShowOptions: false,
      isShowDetail: false
    })
  }

  askClearCart = () => {
    Taro.showModal({
      content: '清空购物车？'
    }).then(({confirm}) => {
      confirm && this.clearCart()
    })
	}
	
	handleChange = value => {
		let keyword = value.trim()
    if(keyword && keyword != '') {
      this.setState({
				keyword
			}, () => {
				this.filterGoods()
			})
    }else {
      this.setState({
        filterList: null,
        keyword: ''
      })
    }
	}


  render() {
		const { theme, menu_cart } = this.props
    const {id, fs_id} = this.$router.params
    const carts = (this.props.carts[+id] || []).filter(item => !item.fs_id || item.fs_id === +fs_id)
    let limitText = ['每单', '每天', '每人']
    const {
        filterList, isShowCart,
      isShowDetail, isShowOptions, curGood, curCart, stanInfo, propertyTagIndex,
      optionalTagIndex
    } = this.state
    return (
      <View className='shop-search'>
				<View className='page-header'>
					<View className='search-panel'>
						<AtIcon value='search' className='search-icon' size='18'/>
						<AtInput
							focus
							placeholder='搜索关键词'
							name='keyword'
							type='text'
							placeholderStyle={'transform: translateY(2px)'}
							clear
							border={false}
							value={keyword}
							onChange={(e) => { this.handleChange(e) }}
						/>
					</View>
					<View className='cancel-panel' onClick={() => { Taro.navigateBack() }}>取消</View>
				</View>
				{
					filterList && 
					<View className='good-list'>
						{
							filterList.length == 0 &&
							<View className='empty'>
								<Image className='empty-img' mode="widthFix" src={noListPng}/>
								<View className='empty-tip'>——  找不到啦  ——</View>
							</View>
						}
						{
							filterList.length > 0 && filterList.map((good, i) => {
								const cartGood = carts.find(item => !item.fs_id && (item.g_id === good.g_id))
								return (
									<View className='good' key={i}>
										<View className='img-wrap' onClick={this.showDetail.bind(this, good)}>
											{
												good.tag_name &&
												<Text className={classnames('tag')} style={{background: good.tag_color}}>{good.tag_name}</Text>
                      }
                      {
                        good.g_highlight &&
                        <View className={`highlight theme-bg-${theme}`}>{good.g_highlight}</View>
                      }
											<Image src={good.g_image_100 || ''}/>
										</View>
										<View className='info'>
											<View className='name'>
												<Text onClick={this.showDetail.bind(this, good)}>{good.g_title}</Text>
                        {
                          good.g_takeaway == 2 &&
                          <View className='takeaway'>不外送</View>
                        }
											</View>
											<View
												className='pre-price' style={{visibility: +good.g_original_price !== 0 ? 'visible' : 'hidden'}}
											>
												&yen;{good.g_original_price}
											</View>
											<View className='price'><Text>&yen;</Text>
												<Text className='font-xin-normal'>{good.g_price}</Text>
											</View>
											<View className={`handle ${good.g_limit != 0 ? 'bottom': ''}`} onClick={this.stopPropagation}>
												{
													good.g_combination === 1 &&
													<Block>
														{
															good.g_has_norm === 2 &&
															<Numbox
																num={cartGood.num}
																showNum={cartGood && cartGood.num !== 0}
																onReduce={this.this.setCart.bind(this, good, -1, cartGood)}
																onAdd={this.setCart.bind(this, good, 1)}
															/>
														}
														{
															good.g_has_norm === 1 &&
															<IdButton onClick={this.openOptions.bind(this, good)}
																			className={'theme-bg-' + theme}
															>选规格</IdButton>
														}
													</Block>
												}

												{
													good.g_combination === 2 &&
													<IdButton onClick={this.toStandardDetail.bind(this, good)}
																	className={'theme-bg-' + theme}
													>选规格</IdButton>
												}
											</View>
										</View>
									</View>
								)
							})
						}
					</View>
					
				}
				{
          isShowCart && carts.length > 0 &&
          <Text className='mask' onClick={this.closeCart} onTouchMove={this.stopPropagation} />
        }
        <View
          onTouchMove={this.stopPropagation}
          className={classnames('cart', isShowCart && carts.length > 0 ? 'active' : '')}>
          <View className='cart-head'>
            <Image src={require('../../assets/images/icon-trash.png')}/>
            <Text onClick={this.askClearCart}>清空购物车</Text>
          </View>
          <ScrollView scrollY className='cart-list'>
            {
              carts.map((good, index) => (
                good.num && good.num !== 0 &&
                (
                  !good.optionalnumstr ?
                  <View className='item' key={index}>
                    <View class='item-left'>
                      <View className='name'>
                        {good.g_title}
                      </View>
                      <View className='param'>
                        {
                          good.property &&
                          good.property.map((prop, i) => (
                            <Text key={i}>
                              {prop.list_name[good.propertyTagIndex[i]]}
                              {i !== good.property.length - 1 ? '+' : ''}
                            </Text>
                          ))
                        }
                        {
                          good.property && good.property.length > 0 &&
                          good.optional && good.optional.length > 0 ? '+' : ''
                        }
                        {
                          good.optional &&
                          good.optional.map((opt, i) => (
                            <Text key={i}>
                              {opt.list[good.optionalTagIndex[i]].gn_name}
                              {i !== good.optional.length - 1 ? '+' : ''}
                            </Text>
                          ))
                        }
                      </View>
                    </View>
                    <View class='item-center'>
                      <Text className={'theme-c-' + theme}>&yen;
                        <Text className='font-xin-normal'>
                          {
                            good._total.toFixed(2)
                          }
                        </Text>
                      </Text>
                      {
                        good.g_original_price && (good.g_original_price - 0) !== 0 &&
                        <Text className='pre-price'>&yen;{good.g_original_price * good.num}</Text>
                      }
                    </View>

                    <Numbox
                      num={good.num} showNum
                      onReduce={this.setCart.bind(this, good, -1, good)}
                      onAdd={this.setCart.bind(this, good, 1)}
                    />
                  </View>
                    :
                  <View className='item' key={index}>
                    <View class='item-left'>
                      <View className='name'>
                        {good.g_title}
                      </View>
                      <View className='param'>
                        {
                          good.fixed ?
                          good.fixed.reduce((total, fix) => {
                            total.push(`${fix.gn_name}(${fix.gn_num}份)`)

                            return total
                          }, []).join('+') : ''
                        }
                        {
                          good.fixed.length > 0 && good.optional.length > 0 ? '+' : ''
                        }
                        {
                          good.optional ?
                          good.optional.reduce((total, opt) => {

                            let str = opt.list.reduce((t, o) => {
                              o.num && (t.push(`${o.gn_name}(${o.num}份)`))
                              return t
                            }, [])

                            total.push(str.join('+'))

                            return total
                          }, []).join('+') : ''
                        }
                      </View>
                    </View>
                    <View class='item-center'>
                      <Text className={'theme-c-' + theme}>&yen;
                        {
                          good._total.toFixed(2)
                        }
                      </Text>
                      {
                        good.g_original_price && (good.g_original_price - 0) !== 0 &&
                        <Text className='pre-price'>&yen;{good.g_original_price * good.num}</Text>
                      }
                    </View>

                    <Numbox
                      num={good.num} showNum
                      onReduce={this.setComboCart.bind(this, good, -1)}
                      onAdd={this.setComboCart.bind(this, good, 1)}
                    />
                  </View>
                )
              ))
            }
          </ScrollView>

        </View>

        <Curtain show={isShowDetail} onCLose={this.closeDetail}>
          {
            curCart &&
            <View className='good-detail'>
              <View className='image-wrap'>
                <Image src={curGood.g_image_300}/>
              </View>
              <View className='info'>
                <View className='title'>
                  {
                    curGood.tag_name &&
                    <Text className={classnames('tag', 'theme-grad-bg-' + theme)}>{curGood.tag_name}</Text>
                  }
                  <Text className='name'>{curGood.g_title}</Text>
                </View>
                <View className='desc'>{curGood.g_description}</View>
                <View className='price-wrap'>
                  <View className={classnames('price', 'theme-c-' + theme)}>
                    <Text>&yen;</Text>
                    <Text className='font-xin-normal'>{curGood.g_price}</Text>
                  </View>
                  {
                    curGood.g_original_price * 1 !== 0 &&
                    <View className='pre-price'><Text>&yen;</Text>{curGood.g_original_price}</View>
                  }
                  {
                    curGood.g_has_norm === 2 &&
                    (!curCart.num || curCart.num === 0) &&
                    <IdButton
                      className={'theme-grad-bg-' + theme} onClick={this.setLocalCart.bind(this, 1)}
                    >
                      加入购物车
                    </IdButton>
                  }
                  {
                    curGood.g_has_norm === 2 && curCart.num &&
                    curCart.num !== 0 &&
                    <Numbox
                      num={curCart.num}
                      showNum
                      onReduce={this.setLocalCart.bind(this, -1)}
                      onAdd={this.setLocalCart.bind(this, 1)}
                    />
                  }

                  {
                    curGood.g_combination === 1 && curGood.g_has_norm === 1 &&
                    <IdButton
                      className={'theme-grad-bg-' + theme} onClick={this.toChooseStan}
                    >
                      选规格
                    </IdButton>
                  }

                  {
                    curGood.g_combination === 2 &&
                    <IdButton
                      className={'theme-grad-bg-' + theme} onClick={this.toStandardDetail.bind(this, curGood)}
                    >
                      选规格
                    </IdButton>
                  }

                </View>
              </View>
            </View>
          }
        </Curtain>

        <Modal
          show={isShowOptions} title={curGood.g_title}
          blackTitle
          titleAlign='center' onHide={this.closeOptions.bind(this, curGood)}
        >
          <View className='option-modal-content'>
            <ScrollView scrollY>
              {
                stanInfo.norm.optional.map((item, index) => (
                  <View className='block' key={index}>
                    <View className='name'>{item.title}</View>
                    <View className='options'>
                      {
                        item.list.map((option, i) => (
                          <View
                            onClick={this.selectTag.bind(this, 'optionalTagIndex', index, i)} key={i}
                            className={optionalTagIndex[index] === i ? 'active theme-grad-bg-' + theme : ''}
                          >{option.gn_name}</View>
                        ))
                      }
                    </View>
                  </View>
                ))
              }
              {
                stanInfo.property.map((item, index) => (
                  <View className='block' key={index}>
                    <View className='name'>{item.name}</View>
                    <View className='options'>
                      {
                        item.list_name.map((option, i) => (
                          <View
                            onClick={this.selectTag.bind(this, 'propertyTagIndex', index, i)} key={i}
                            className={propertyTagIndex[index] === i ? 'active theme-grad-bg-' + theme : ''}
                          >{option}</View>
                        ))
                      }
                    </View>
                  </View>
                ))
              }
            </ScrollView>

            <View className='price-wrap'>
              <View className='price-box'>
                <View className={classnames('price', 'theme-c-' + theme)}>
                  <Text>&yen;</Text>
                  <Text className='font-xin-normal'>
                    {
                      (+curGood.g_price + (stanInfo.norm &&
                        stanInfo.norm.optional.reduce((total, item, index) => {
                          total += +item.list[optionalTagIndex[index]].gn_price
                          return total
                        }, 0))).toFixed(2)
                    }
                  </Text>
                </View>
                {
                  curGood.g_original_price * 1 !== 0 &&
                  <View className='pre-price'>
                    <Text>&yen;</Text>
                    {curGood.g_original_price}
                  </View>
                }
              </View>
              {
                (curCart.optionalstr !== (propertyTagIndex.join('') + optionalTagIndex.join('')) &&
                  !curCart.num || curCart.num === 0) ?
                <IdButton
                  className={'theme-grad-bg-' + theme} onClick={this.setLocalCart.bind(this, 1)}
                >
                  加入购物车
                </IdButton>
                  :
                  <Numbox
                    num={curCart.num} showNum
                    onReduce={this.setLocalCart.bind(this, -1)}
                    onAdd={this.setLocalCart.bind(this, 1)}
                  />
              }
            </View>
          </View>
        </Modal>

        <PayBox
          theme={theme} carts={carts} storeId={+this.$router.params.id}
          themeInfo={menu_cart}
          onPay={this.handlePay}
          onTop={this.handleTop}
          onOpenCart={this.ToggleShowCart}
        />
			</View>
    )
  }
}

export default ShopSearch