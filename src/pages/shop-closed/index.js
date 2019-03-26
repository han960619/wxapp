import Taro, {Component} from '@tarojs/taro'
import {View, Text, Button} from '@tarojs/components'
import {connect} from '@tarojs/redux'
import classnames from 'classnames'
import './index.less'


@connect(({common}) => ({...common}))
class Closed extends Component {
  config = {
    navigationBarTitleText: '首页',
  }

  state = {
  }

  componentWillMount () {
	}
	
	tellPhone = () => {
    const { phone } = this.$router.params
    Taro.makePhoneCall({
      phoneNumber: phone
    }).then({})
	}


  render() {

    return (
      <View className="close-container">
        <View className="close-cover">
        <Image src='../../assets/images/closed.png' mode="widthFix"/>
        </View>
        <View className="close-tip">店铺服务已打烊，请致电商家</View>
        <View className="close-action"  onClick={this.tellPhone}>联系商家</View>
      </View>
    )
  }
}

export default Closed
