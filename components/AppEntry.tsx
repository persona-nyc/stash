
import { useAccount } from '../entry/hooks'
import ActionLog from './StashLog'
import ActionLogItem from './StashLogItem'
import I from 're-slide'

export default function StashApp() {
	let account = useAccount()
	let actions = [{

	}]
	return (
		<div>
			<div>
				<div>
					<DashMenu></DashMenu>
				</div>
				<div>
					<StashDash></StashDash>
				</div>
			</div>
			<div>
				<StashLog>
					<StashLogItem actions={actions}></StashLogItem>
				</StashLog>
			</div>
		</div>
	)
}