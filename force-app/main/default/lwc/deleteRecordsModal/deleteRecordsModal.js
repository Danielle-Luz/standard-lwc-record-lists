import LightningModal from 'lightning/modal';
import { api } from 'lwc';


export default class DeleteRecordsModal extends LightningModal {
  @api
  label;

  @api
  title;

  @api
  description = false;
}