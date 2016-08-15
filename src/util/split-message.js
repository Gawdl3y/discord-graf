'use babel';
'use strict';

export default function splitMessage(text, maxLength = 1925) {
	const splitText = text.split('\n');
	if(splitText.length === 1 && text.length > maxLength) throw new Error('Message exceeds the max length and has no newlines.');
	const messages = [''];
	let msg = 0;
	for(let i = 0; i < splitText.length; i++) {
		if(messages[msg].length + splitText[i].length + 1 > maxLength) {
			messages.push('');
			msg++;
		}
		messages[msg] += (messages[msg].length > 0 ? '\n' : '') + splitText[i];
	}
	return messages;
}
