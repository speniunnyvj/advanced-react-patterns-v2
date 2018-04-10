// control props

import React from 'react'
import {Switch} from '../switch'

class Toggle extends React.Component {
  state = {on: false}
  // 🐨 let's add a function that can determine whether
  // the on prop is controlled. Call it `isOnControlled`.
  // 💰 this.props.on !== undefined
  //
  // 🐨 Now let's add a function that can return the state
  // whether it's coming from this.state or this.props
  // Call it `getState` and have it return on from
  // state if it's not controlled or props if it is.
  toggle = () => {
    // 🐨 if the toggle is controlled, then we shouldn't
    // be updating state. Instead we should just call
    // `this.props.onToggle` with what the state should be
    this.setState(
      ({on}) => ({on: !on}),
      () => {
        this.props.onToggle(this.state.on)
      },
    )
  }
  render() {
    // 🐨 rather than getting state from this.state,
    // let's use our `getState` method.
    const {on} = this.state
    return <Switch on={on} onClick={this.toggle} />
  }
}

class Usage extends React.Component {
  state = {bothOn: false}
  handleToggle = on => {
    this.setState({bothOn: on})
  }
  render() {
    const {bothOn} = this.state
    const {toggle1Ref, toggle2Ref} = this.props
    return (
      <div>
        <Toggle on={bothOn} onToggle={this.handleToggle} ref={toggle1Ref} />
        <Toggle on={bothOn} onToggle={this.handleToggle} ref={toggle2Ref} />
      </div>
    )
  }
}

export {Toggle, Usage}
