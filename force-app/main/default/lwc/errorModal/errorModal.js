import { LightningElement, api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ErrorModal extends LightningModal {
    @api
    errorMessage;
}