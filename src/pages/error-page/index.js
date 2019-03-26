import Taro, {Component} from '@tarojs/taro'
import {View} from '@tarojs/components'
import './index.less'

class ErrorPage extends Component {
  config = {
    navigationBarTitleText: '哎呀，出错了',
  }

  state = {
  }

  componentWillMount () {
	}
	
	backIndex = () => {
    Taro.navigateBack()
	}


  render() {

    return (
      <View className="close-container">
        <View className="close-cover">
        <Image src='../../assets/images/error.png' mode="widthFix"/>
        </View>
        <View className="close-tip">网络已断开，网络信号弱或路由器故障，建议重新设置网络</View>
        <View className="close-action"  onClick={this.backIndex}>重新加载</View>
      </View>
    )
  }
}

export default ErrorPage
