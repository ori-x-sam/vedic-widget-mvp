// Entry: boot the runtime into #app. In development, the stores and input are on window.jm for poking at.
import * as Runtime from './runtime';
import * as Actions from './actions';
import * as Game from './game';
import * as Input from './input';
import { game, ui } from './store';

void Runtime.boot(document.getElementById('app')!);
if (import.meta.env.DEV) Object.assign(window, { jm: { game, ui, Actions, Game, Input, Runtime } });
