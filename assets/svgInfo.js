import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
/* SVGR has dropped some elements not supported by react-native-svg: title */
const SvgInfoComponent = (props) => (
  <Svg xmlns='http://www.w3.org/2000/svg' {...props}>
    <Path fill='#063855' fillRule='evenodd' d='M0 0h48v1H0z' />
  </Svg>
);
export default SvgInfoComponent;
