public without sharing class CaseController {
    @AuraEnabled
    public static List<Case> getCaseList(String searchedName){
        String formattedSearchedName = '%' + searchedName + '%';

        try {
            List<Case> caseList = [SELECT Id, AccountId, CaseNumber, ContactId, CreatedDate, OwnerId, Priority, Status, Subject, Type  FROM Case WHERE CaseNumber LIKE :formattedSearchedName];
            
            return caseList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void deleteCaseRecords(List<String> recordsId){
        try {
            if(Schema.sObjectType.Case.isDeletable()) {
                List<Case> recordsToBeDeleted = [SELECT Id FROM Case WHERE Id IN :recordsId];

                delete recordsToBeDeleted;
            }
        } catch (Exception e) {
            System.debug(e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static void removeDeletedContactFromCases(List<String> deletedContactsIds) {
        List<Case> casesRelatedToDeletedContacts = [SELECT Id FROM Case WHERE ContactId IN :deletedContactsIds];

        if(Schema.sObjectType.Case.isUpdateable()) {
            for(Case relatedCase : casesRelatedToDeletedContacts) {
                relatedCase.ContactId = null;
            }
    
            update casesRelatedToDeletedContacts;
        } else if (casesRelatedToDeletedContacts.size() > 0) {
            throw new AuraHandledException('Couldn\'t update the cases associated with the deleted contacts');
        }
    }
}