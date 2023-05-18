
import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getContactList from '@salesforce/apex/ContactController.getContactList';
import getAccountList from '@salesforce/apex/AccountController.getAccountList';
import getCaseList from '@salesforce/apex/CaseController.getCaseList';
import deleteContactRecords from '@salesforce/apex/ContactController.deleteContactRecords';
import deleteAccountRecords from '@salesforce/apex/AccountController.deleteAccountRecords';
import deleteCaseRecords from '@salesforce/apex/CaseController.deleteCaseRecords';

// object containing apex methods related to the object's api name
const objectMethods = {
    Account: {
        deleteRecordsMethod: deleteAccountRecords,
        getRecordsMethod: getAccountList
    },
    Contact: {
        deleteRecordsMethod: deleteContactRecords,
        getRecordsMethod: getContactList
    },
    Case: {
        deleteRecordsMethod: deleteCaseRecords,
        getRecordsMethod: getCaseList
    },
}

export default class RecordsList extends LightningElement {
    @api
    objectApiName;

    @track
    data = {};

    columns = [];

    numberOfRowsDisplayed = 10;

    dataIsLoading;

    allRecords;

    recordsPageNumber;

    selectedRecords;

    get objectIcon() {
        const iconName = "standard:" + this.objectApiName.toLowerCase();

        return iconName;
    }

    get isObjectDataEmpty() {
        const objectIsEmpty = Object.keys(this.data).length == 0;

        return objectIsEmpty;
    }

    getObjectData() {
        const searchInput = this.template.querySelector("[data-id='search-input']");
        const searchedRecordName = searchInput?.value || "";

        const getObjectRecordsMethod = objectMethods[this.objectApiName].getRecordsMethod;

        this.dataIsLoading = true;

        getObjectRecordsMethod({ searchedName: searchedRecordName })
            .then(objectRecords => {
                this.allRecords = objectRecords;

                this.recordsPageNumber = 0;

                this.showRecordsInSpecificPage();
            })
            .catch(error => {
                console.log(error);
            })
            .finally(() => {
                this.dataIsLoading = false;
            });
    }

    clearSearch() {
        const searchInput = this.template.querySelector("[data-id='search-input']");

        searchInput.value = "";

        this.getObjectData();
    }

    showRecordsInSpecificPage() {
        const firstRecordInPageIndex = this.recordsPageNumber * this.numberOfRowsDisplayed;
        const lastRecordInPageIndex = firstRecordInPageIndex + this.numberOfRowsDisplayed;

        const setOfRecordsToBeShown = this.allRecords.slice(firstRecordInPageIndex, lastRecordInPageIndex);

        this.data = setOfRecordsToBeShown;
    }

    getRecordsInTheNextPage() {
        const maxPageNumber = (this.allRecords.length / this.numberOfRowsDisplayed) - 1;

        if (this.recordsPageNumber < maxPageNumber) {
            this.recordsPageNumber += 1;

            this.showRecordsInSpecificPage();
        }
    }

    getRecordsInThePreviousPage() {
        const minPageNumber = 0;

        if (this.recordsPageNumber > minPageNumber) {
            this.recordsPageNumber -= 1;

            this.showRecordsInSpecificPage();
        }
    }

    addManageRecordMenu() {
        const menuMetadata = {
            type: "action",
            typeAttributes: {
                rowActions: [
                    {
                        label: "Open record",
                        name: "view"
                    }
                ],
                menuAlignment: "right"
            }
        }

        this.columns.push(menuMetadata);
    }

    openRecordInNewWindow(recordId) {
        const recordUrl = `/lightning/r/${this.objectApiName}/${recordId}/view`;

        window.open(recordUrl);
    }

    handleRecordMenuActions(event) {
        const clickedActionName = event.detail.action.name;
        const selectedRecordId = event.detail.row.Id;

        switch (clickedActionName) {
            case "view":
                this.openRecordInNewWindow(selectedRecordId);

                break;
        }
    }

    updateSelectedRecordsList(event) {
        this.selectedRecords = event.detail.selectedRows;
    }

    deleteSelectedRecords(event) {
        const deleteRecordsMethod = objectMethods[this.objectApiName].deleteRecordsMethod;

        const selectedRecordsIds = this.selectedRecords.map(record => {
            return record.Id
        });

        if (selectedRecordsIds.length > 0) {
            deleteRecordsMethod({ recordsId: selectedRecordsIds })
                .then(() => {
                    // apagou
                    this.getObjectData();
                })
                .catch((error) => {
                    console.log(error);
                    // toast de erro
                })
        }
    }

    connectedCallback() {
        this.getObjectData();
    }

    @wire(getObjectInfo, { objectApiName: "$objectApiName" })
    getObjectColumns({ data, error }) {
        if (data) {
            const selectedFieldsApiNames = ["Name", "AccountId", "Title", "Phone", "Email", "Type", "OwnerId", "CaseNumber", "ContactId", "Status", "Priority", "CreatedDate", "Subject"];

            for (let objectFieldName in data.fields) {
                const fieldMetadata = data.fields[objectFieldName];

                if (!selectedFieldsApiNames.includes(fieldMetadata["apiName"])) {
                    continue;
                }

                const label = fieldMetadata["label"];
                const fieldName = fieldMetadata["apiName"];
                const type = fieldMetadata["dataType"];

                const newColumn = { label, fieldName, type };

                this.columns = [...this.columns, newColumn];
            };

            this.addManageRecordMenu();
        } else if (error) {
            console.log(error);
        }
    };
}