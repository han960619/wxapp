import Taro from '@tarojs/taro'
export const getTouchData = (endX, endY, startX, startY)=> {
  let turn = '';
  if (endX - startX > 50 && Math.abs(endY - startY) < 50) {      //右滑
    turn = 'right';
  } else if (endX - startX < -50 && Math.abs(endY - startY) < 50) {   //左滑
    turn = 'left';
  }
  return turn;
}

const getGoodOptional = (good)=> {
  return (good.optional ?
    good.optional.reduce((total, item, i) => {
      return total += +item.list[good.optionalTagIndex[i]].gn_price
    }, 0)
    : 0)
}


export const sortCartGood = (curCart, good, num) => {

  // _num 该商品在购物车中总共多少个
  let _num = curCart.filter(item => item.g_id === good.g_id).reduce((total, opt) => {
    return total += opt.num
  }, 0)

  let goodOver = 0

  // 添加或减少该商品 改变购物车后  该商品的数量  >0超出  <=0未超出
  let _over = good.g_limit_num > 0 ? (_num + num - good.g_limit_num + (good.g_limit_buy || 0)) : 0
  _over = _over < 0 ? 0 : _over
  // 将超出添加操作
  if(_over > 0 && good.g_limit_num > 0 && num > 0) {
    Taro.showToast({
      title: `该折扣商品已达折扣上限，超出则恢复原价`,
      icon: 'none'
    })
    goodOver = 1
  }

  // 减少操作
  if(_over >= 0 && num < 0 && good.g_limit_num > 0) {
    goodOver = -1
  }

  if (!good.propertyTagIndex || good.propertyTagIndex.length === 0) {
    // index 商品在购物车中的位置
    let index = curCart.findIndex(item => !item.fs_id && (item.g_id === good.g_id) && (item.optionalstr === good.optionalstr))
    
    if (index > -1) {
      !curCart[index].num && (curCart[index].num = 0)
      curCart[index].num += num

      // 限购操作
      curCart[index].overNum = curCart[index].overNum || 0
      if(goodOver != 0) {
        curCart[index].overNum += num 
        curCart[index].overNum = curCart[index].overNum < 0 ? 0 : curCart[index].overNum
        curCart[index]._total = _over * (+good.g_original_price) + (curCart[index].num - _over) * (+good.g_price)
      }else {
        curCart[index]._total += num * (+good.g_price)
      }

      good.again_id && (curCart[index].again_id = good.again_id)
      curCart[index].num === 0 && curCart.splice(index, 1)
    } else {
      good.overNum = _over < 0 ? 0 : _over
      good._total = _over * (+good.g_original_price) + (num - _over) * (+good.g_price)
      curCart.push({...good, num})
    }
  } else {
    curCart.map((item, index) => item.index = index)
    let idAlikes = curCart.filter(item => item.g_id === good.g_id)
    if (idAlikes.length === 0) {
      good.overNum = _over < 0 ? 0 : _over
      good._total = _over * good.g_original_price + (num - _over) * (+good.g_price)
      curCart.push({...good, num})
    } else{
      let index = idAlikes.findIndex(item => !item.fs_id && (item.optionalstr === good.optionalstr))
      
      if (index > -1) {
        let i = idAlikes[index].index
        curCart[i].num += num

        // 限购操作
        curCart[i].overNum = curCart[i].overNum || 0
        if(goodOver == 0) {
          curCart[i]._total += num * (+good.g_price + getGoodOptional(good))
        }else if (goodOver == 1) {
          curCart[i].overNum += num
          curCart[i]._total += num * (+good.g_original_price + getGoodOptional(good))
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
                    break;
                  }
                }  
              } 
            }
          }else if(_over < 0){
            curCart[i]._total -= +good.g_price + getGoodOptional(good)
          }
          curCart[i].overNum += num 
          curCart[i].overNum = curCart[i].overNum < 0 ? 0 : curCart[i].overNum
        }
        curCart[i].num === 0 && curCart.splice(i, 1)
        good.again_id && (curCart[i].again_id = good.again_id)
      } else {
        good.overNum = good.overNum || 0
        
        if(_over > 0) {
          good.overNum += ( _over - good.num ) >= 0 ? good.num : _over
        }
        if(( _over - good.num ) >= 0) {
          good._total = good.num * (+good.g_original_price + getGoodOptional(good))
        }else {
          good._total = _over * (+good.g_original_price + getGoodOptional(good)) + (good.num - _over) * (+good.g_price + getGoodOptional(good))
        }
        curCart.push({...good, num})
      }
    }
  }

  console.log(curCart)

  return curCart
}
