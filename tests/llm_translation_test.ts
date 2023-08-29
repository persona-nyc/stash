

//the purpose of this test is to create a rule set that can be used to generate natural language rules for the stash api...
//if test is 100% accurate then we can generate some rough conditional statements and then translate them into natural language terms and save into a cache object.











// adding rule classes to the rule registry which can either be paired with other classes or used on their own, or nested within other rules.
class TransactionLessThanAmount extends TransActionRule {
	params: {
		amount: TokenAmount,
	}
	test(action: TransAction): boolean {
		if (action.amount.isLess(this.params.amount)) {
			return true;
		}
		return false;
	}

	plainRender(): any {
		return ['transation amount is less than', { token: this.params.amount }]
	}
}


//checks if the stash of the action
class AgentHasStashBadgeRule extends ActionRule {
	params: {
		badge_id: string,
	}
	plainRender(): any {
		return ["member holds", { badge_id: this.params.badge_id }]
	}
	test(action: TransAction | AlterAction): boolean {
		action.stash.badges.forEach((badge) => {
			if (badge.id == this.params.badge_id) {
				if (badge.agent.id == action.agent.id) {
					return true;
				}
			}
		})
		return false;
	}
}


//now we can combine these predefined rules together to create more complex rules using the RuleSet class.



//transaction is okay if 
// action agent has badge "verified" and transaction is less than 100.00 USD
// and
// transaction is less than 100.00 USD
function money(amount: number): TokenAmount {
	return new TokenAmount(amount)
}


//if action agent is missing badge "parent" then limit transaction amount to 100.00 USD
let parent_has_no_limit = new RuleSet([
	{
		check_if: new AgentHasStashBadgeRule({ badge_id: 'parent' }),
		is: false,
		if_true_then: [{
			check_if: new TransactionLessThanAmount({ amount: money(100) }),
			is: true
			if_true_then: TRANSACTION_OKAY
		}]
	}
])

//parent_has_no_limit.toString() will be:
/*
	allow transaction when member has badge {badge_id} is false and transaction is less than {amount} is false

*/




let child_has_less_limit = new RuleSet([
	{
		rule: new AgentHasStashBadgeRule({ badge_id: 'child' }),
		expect: true,
		conditions: [{
			rule: new TransactionLessThanAmount({ amount: money(100) }),
			expect: false
		}]
	}
])


// the resulting limit_non_parent.toTemplateString() will be:
/*
	where member does not hold badge "parent"
		limit transaction amount to {limit.toDefaultString()}

*/



// the resulting limit_parent.toTemplateString() will be:
// on any transaction
//limit to where member holds badge "parent"





//for the above code when you run .toString() this natural language rule template will be generated on client:
//on any transaction
//where member holds badge {badge:"verified"}
//limit transaction amount to {amount:100.00,token:"USD",token_symbol:"$"}



import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});

async function main() {
	const completion = await openai.chat.completions.create({
		messages: [{ role: 'user', content: 'Say this is a test' }],
		model: 'gpt-3.5-turbo',
	});

	console.log(completion.choices);
}

main();