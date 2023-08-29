

//action log component, contains action log items
export default function ActionLog({ stash: Stash }) {
	return <div>
		{Stash.actionLog.map((action, index) => {
			<ActionLogItem key={index} action={action} />
		})}
	</div>
}