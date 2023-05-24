
import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import DeleteRecordsModal from 'c/deleteRecordsModal';
import getContactList from '@salesforce/apex/ContactController.getContactList';
import getAccountList from '@salesforce/apex/AccountController.getAccountList';
import getCaseList from '@salesforce/apex/CaseController.getCaseList';
import deleteContactRecords from '@salesforce/apex/ContactController.deleteContactRecords';
import deleteAccountRecords from '@salesforce/apex/AccountController.deleteAccountRecords';
import deleteCaseRecords from '@salesforce/apex/CaseController.deleteCaseRecords';

// object containing apex methods related to the object's api name
const objectMethods = {
    Account: {
        deleteRecords: {
            method: deleteAccountRecords,
            modalMetadata: {
                label: "Delete account's records",
                title: "Do you want to delete these accounts? ",
                description: "The account's reference in 'Closed Won' opportunities will become null"
            }
        },
        getRecords: getAccountList
    },
    Contact: {
        deleteRecords: {
            method: deleteContactRecords,
            modalMetadata: {
                label: "Delete contact's records",
                title: "Do you want to delete these contacts? ",
                description: "The contact's reference in related cases will become null"
            }
        },
        getRecords: getContactList
    },
    Case: {
        deleteRecords: {
            method: deleteCaseRecords,
            modalMetadata: {
                label: "Delete case's records",
                title: "Do you want to delete these cases? ",
            }
        },
        getRecords: getCaseList
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

    @track
    filteredRecords;

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

    get isTheMaxPage() {
        const maxPageNumber = (this.filteredRecords.length / this.numberOfRowsDisplayed) - 1;

        return this.recordsPageNumber >= maxPageNumber;
    }

    get isTheMinPage() {
        const minPageNumber = 0;

        return this.recordsPageNumber == minPageNumber;
    }

    getObjectData() {
        const getObjectRecordsMethod = objectMethods[this.objectApiName].getRecords;

        this.dataIsLoading = true;

        getObjectRecordsMethod({ searchedName: "" })
            .then(objectRecords => {
                this.allRecords = objectRecords;
                
                this.showRecordsInSpecificPage(objectRecords);
            })
            .catch(error => {
                console.log(error);
            })
            .finally(() => {
                this.dataIsLoading = false;
            });
    }

    showRecordsInSpecificPage(filteredRecords) {
        if(filteredRecords != undefined) {
            this.recordsPageNumber = 0;

            this.filteredRecords = filteredRecords;
        }

        const firstRecordInPageIndex = this.recordsPageNumber * this.numberOfRowsDisplayed;
        const lastRecordInPageIndex = firstRecordInPageIndex + this.numberOfRowsDisplayed;

        const setOfRecordsToBeShown = this.filteredRecords.slice(firstRecordInPageIndex, lastRecordInPageIndex);

        this.data = setOfRecordsToBeShown;
    }

    getRecordsInTheNextPage() {
        if (!this.isTheMaxPage) {
            this.recordsPageNumber += 1;

            this.showRecordsInSpecificPage();
        }
    }

    getRecordsInThePreviousPage() {
        if (!this.isTheMinPage) {
            this.recordsPageNumber -= 1;

            this.showRecordsInSpecificPage();
        }
    }

    searchRecords() {
        const searchInput = this.template.querySelector("[data-id='search-input']");
        const searchedValue = searchInput.value.toLowerCase();

        const foundRecords = this.allRecords.filter(recordData => {
            const allRecordFieldValues = JSON.parse(JSON.stringify(Object.values(recordData)));
            
            const someFieldHasTheSearchedValue = allRecordFieldValues.some(fieldValue => {
                const fieldIsNestedObject = typeof fieldValue === 'object';

                if(fieldIsNestedObject) {
                    const nestedObjectFieldValues = Object.values(fieldValue);

                    allRecordFieldValues.push([...nestedObjectFieldValues]);
                    
                    return false;
                }

                return new String(fieldValue).toLowerCase().includes(searchedValue);
            });
            
            return someFieldHasTheSearchedValue;
        });

        this.showRecordsInSpecificPage(foundRecords);
    }

    clearSearch() {
        this.showRecordsInSpecificPage(this.allRecords);
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
        this.openDeleteModal();
        
        const deleteRecords = objectMethods[this.objectApiName].deleteRecords.method;

        const selectedRecordsIds = this.selectedRecords.map(record => {
            return record.Id
        });

        if (selectedRecordsIds.length > 0) {
            deleteRecords({ recordsId: selectedRecordsIds })
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

    openDeleteModal() {
        const deleteModalMetadata = objectMethods[this.objectApiName].deleteRecords.modalMetadata;

        DeleteRecordsModal.open(deleteModalMetadata)
        .then(() => {

        });
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