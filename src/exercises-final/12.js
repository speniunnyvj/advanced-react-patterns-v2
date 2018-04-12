// Higher Order Components

import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'
import {Switch} from '../switch'

const ToggleContext = React.createContext({
  on: false,
  toggle: () => {},
  reset: () => {},
  getTogglerProps: () => ({}),
})

const callAll = (...fns) => (...args) => fns.forEach(fn => fn && fn(...args))

class Toggle extends React.Component {
  static defaultProps = {
    initialOn: false,
    onReset: () => {},
    onToggle: () => {},
    onStateChange: () => {},
    stateReducer: (state, changes) => changes,
  }
  static stateChangeTypes = {
    reset: '__toggle_reset__',
    toggle: '__toggle_toggle__',
  }
  static Consumer = ToggleContext.Consumer

  reset = () =>
    this.internalSetState(
      {...this.initialState, type: Toggle.stateChangeTypes.reset},
      () => this.props.onReset(this.getState().on),
    )
  toggle = ({type = Toggle.stateChangeTypes.toggle} = {}) =>
    this.internalSetState(
      ({on}) => ({type, on: !on}),
      () => this.props.onToggle(this.getState().on),
    )
  getTogglerProps = ({onClick, ...props} = {}) => ({
    onClick: callAll(onClick, () => this.toggle()),
    'aria-expanded': this.getState().on,
    ...props,
  })
  initialState = {
    on: this.props.initialOn,
    toggle: this.toggle,
    reset: this.reset,
    getTogglerProps: this.getTogglerProps,
  }
  state = this.initialState
  isControlled(prop) {
    return this.props[prop] !== undefined
  }
  getState(state = this.state) {
    return Object.entries(state).reduce((combinedState, [key, value]) => {
      if (this.isControlled(key)) {
        combinedState[key] = this.props[key]
      } else {
        combinedState[key] = value
      }
      return combinedState
    }, {})
  }
  internalSetState(changes, callback = () => {}) {
    let allChanges
    this.setState(
      state => {
        const combinedState = this.getState(state)
        const stateToSet = [changes]
          // handle function setState call
          .map(c => (typeof c === 'function' ? c(combinedState) : c))
          // apply state reducer
          .map(c => this.props.stateReducer(combinedState, c))
          // store the whole changes object for use in the callback
          .map(c => (allChanges = c))
          // remove the controlled props
          .map(c =>
            Object.keys(state).reduce((newChanges, stateKey) => {
              if (!this.isControlled(stateKey)) {
                newChanges[stateKey] = c.hasOwnProperty(stateKey)
                  ? c[stateKey]
                  : combinedState[stateKey]
              }
              return newChanges
            }, {}),
          )[0]
        return Object.keys(stateToSet).length ? stateToSet : null
      },
      () => {
        // call onStateChange with all the changes (including the type)
        this.props.onStateChange(allChanges, this.state)
        callback()
      },
    )
  }
  render() {
    const {children} = this.props
    const ui = typeof children === 'function' ? children(this.state) : children
    return (
      <ToggleContext.Provider value={this.state}>{ui}</ToggleContext.Provider>
    )
  }
}

function withToggle(Component) {
  const Wrapper = React.forwardRef((props, ref) => (
    <Toggle.Consumer>
      {toggle => <Component {...props} toggle={toggle} ref={ref} />}
    </Toggle.Consumer>
  ))
  Wrapper.displayName = `withToggle(${Component.displayName || Component.name})`
  hoistNonReactStatics(Wrapper, Component)
  return Wrapper
}

// this Subtitle component could be as simple as:
// const Subtitle = withToggle(({toggle: {on}}) => (
//   <span>{on ? '👩‍🏫 👉 🕶' : 'Teachers are awesome'}</span>
// ))
// But for the purposes of this workshop, we've made it a little more complex
// just to ensure you're HOC handles common issues with HOCs
const Subtitle = withToggle(
  class extends React.Component {
    static displayName = 'Subtitle'
    static emoji = '👩‍🏫 👉 🕶'
    static text = 'Teachers are awesome'
    instanceProperty = true
    render() {
      return (
        <span>{this.props.toggle.on ? Subtitle.emoji : Subtitle.text}</span>
      )
    }
  },
)

function Nav() {
  return (
    <Toggle.Consumer>
      {toggle => (
        <nav style={{flex: 1}}>
          <ul
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              listStyle: 'none',
              paddingLeft: '0',
            }}
          >
            <li>
              <a href="index.html">{toggle.on ? '🏡' : 'Home'}</a>
            </li>
            <li>
              <a href="/about/">{toggle.on ? '❓' : 'About'}</a>
            </li>
            <li>
              <a href="/blog/">{toggle.on ? '📖' : 'Blog'}</a>
            </li>
          </ul>
        </nav>
      )}
    </Toggle.Consumer>
  )
}

function NavSwitch() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div>
        <Toggle.Consumer>
          {toggle => (toggle.on ? '🦄' : 'Enable Emoji')}
        </Toggle.Consumer>
      </div>
      <Toggle.Consumer>
        {toggle => (
          <Switch
            {...toggle.getTogglerProps({
              on: toggle.on,
            })}
          />
        )}
      </Toggle.Consumer>
    </div>
  )
}

function Header() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <Nav />
        <NavSwitch />
      </div>
    </div>
  )
}

// This is part of our contrived example so we can test things properly
// to make sure your HOC handles common issues
export class Debug extends React.Component {
  childInstance = React.createRef()
  render() {
    return React.cloneElement(this.props.children, {ref: this.childInstance})
  }
}

function Title() {
  return (
    <div>
      <h1>
        <Toggle.Consumer>
          {toggle => `Who is ${toggle.on ? '🕶❓' : 'awesome?'}`}
        </Toggle.Consumer>
      </h1>
      <Debug child="subtitle">
        <Subtitle />
      </Debug>
    </div>
  )
}

function Article() {
  return (
    <div>
      <Toggle.Consumer>
        {toggle =>
          [
            'Once, I was in',
            toggle.on ? '🏫‍' : 'school',
            'when I',
            toggle.on ? '🤔' : 'realized',
            'something...',
          ].join(' ')
        }
      </Toggle.Consumer>
      <hr />
      <Toggle.Consumer>
        {toggle =>
          [
            'Without',
            toggle.on ? '👩‍🏫' : 'teachers',
            `I wouldn't know anything so`,
            toggle.on ? '🙏' : 'thanks',
            toggle.on ? '👩‍🏫❗️' : 'teachers!',
          ].join(' ')
        }
      </Toggle.Consumer>
    </div>
  )
}

function Post() {
  return (
    <div>
      <Title />
      <Article />
    </div>
  )
}

function Usage() {
  return (
    <Toggle>
      <div>
        <Header />
        <Post />
      </div>
    </Toggle>
  )
}
Usage.title = 'Higher Order Components'

export {Toggle, Usage as default}

/* eslint
"no-unused-vars": [
  "warn",
  {
    "argsIgnorePattern": "^_.+|^ignore.+",
    "varsIgnorePattern": "^_.+|^ignore.+",
    "args": "after-used"
  }
]
 */
