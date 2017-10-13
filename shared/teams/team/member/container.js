// @flow
import * as Constants from '../../../constants/teams'
import * as I from 'immutable'
import {connect} from 'react-redux'
import {compose} from 'recompose'
import {HeaderHoc} from '../../../common-adapters'
import {showUserProfile} from '../../../actions/profile'
import {getProfile} from '../../../actions/tracker'
import {startConversation} from '../../../actions/chat'
import {isMobile} from '../../../constants/platform'
import {TeamMember} from '.'
import {type TypedState} from '../../../constants/reducer'

const getFollowing = (state, username: string) => {
  const followingMap = Constants.getFollowingMap(state)
  return !!followingMap[username]
}

const getFollower = (state, username: string) => {
  const followerMap = Constants.getFollowerMap(state)
  return !!followerMap[username]
}

type StateProps = {
  teamname: string,
  following: boolean,
  follower: boolean,
  _you: ?string,
  _username: string,
  _memberInfo: I.Set<Constants.MemberInfo>,
  loading: boolean,
}

const mapStateToProps = (state: TypedState, {routeProps}): StateProps => ({
  teamname: routeProps.get('teamname'),
  loading: state.entities.getIn(['teams', 'teamNameToLoading', routeProps.get('teamname')], true),
  following: getFollowing(state, routeProps.get('username')),
  follower: getFollower(state, routeProps.get('username')),
  _username: routeProps.get('username'),
  _you: state.config.username,
  _memberInfo: state.entities.getIn(['teams', 'teamNameToMembers', routeProps.get('teamname')], I.Set()),
})

type DispatchProps = {
  onOpenProfile: () => void,
  _onEditMembership: (name: string, username: string) => void,
  _onRemoveMember: (name: string, username: string) => void,
  _onLeaveTeam: (teamname: string) => void,
  _onChat: (string, ?string) => void,
  onBack: () => void,
  // TODO remove member
}

const mapDispatchToProps = (dispatch: Dispatch, {routeProps, navigateAppend, navigateUp}): DispatchProps => ({
  onOpenProfile: () => {
    isMobile
      ? dispatch(showUserProfile(routeProps.get('username')))
      : dispatch(getProfile(routeProps.get('username'), true, true))
  },
  _onEditMembership: (name: string, username: string) =>
    dispatch(
      navigateAppend([
        {
          props: {teamname: name, username},
          selected: 'rolePicker',
        },
      ])
    ),
  _onRemoveMember: (teamname: string, username: string) => {
    dispatch(navigateAppend([{props: {teamname, username}, selected: 'reallyRemoveMember'}]))
  },
  _onLeaveTeam: (teamname: string) => {
    dispatch(navigateAppend([{props: {teamname}, selected: 'reallyLeaveTeam'}]))
  },
  _onChat: (username, myUsername) => {
    username && myUsername && dispatch(startConversation([username, myUsername]))
  },
  onBack: () => dispatch(navigateUp()),
})

const mergeProps = (stateProps: StateProps, dispatchProps: DispatchProps) => {
  // Gather contextual team membership info
  const yourInfo = stateProps._memberInfo.find(member => member.username === stateProps._you)
  const userInfo = stateProps._memberInfo.find(member => member.username === stateProps._username)
  const you = {
    username: stateProps._you,
    type: yourInfo && yourInfo.type,
  }
  const user = {
    username: stateProps._username,
    type: userInfo && userInfo.type,
  }
  // If they're an owner, you need to be an owner to edit them
  // otherwise you just need to be an admin
  const admin = user.type === 'owner' ? you.type === 'owner' : you.type === 'owner' || you.type === 'admin'
  return {
    ...stateProps,
    ...dispatchProps,
    admin,
    user,
    you,
    onChat: () => dispatchProps._onChat(stateProps._username, stateProps._you),
    onEditMembership: () => dispatchProps._onEditMembership(stateProps.teamname, stateProps._username),
    onRemoveMember: () => {
      if (stateProps._username === stateProps._you) {
        dispatchProps._onLeaveTeam(stateProps.teamname)
      } else {
        dispatchProps._onRemoveMember(stateProps.teamname, stateProps._username)
      }
    },
  }
}

export default compose(connect(mapStateToProps, mapDispatchToProps, mergeProps), HeaderHoc)(TeamMember)
