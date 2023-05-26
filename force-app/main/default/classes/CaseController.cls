public without sharing class CaseController {
    @AuraEnabled
    public static List<Case> getCaseList(){
        try {
            List<Case> caseList = [SELECT Id, ContactEmail, IsClosed, CaseNumber, ClosedDate, Priority, Status, Subject, Type  FROM Case];
            
            return caseList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String deleteCaseRecords(List<String> recordsId){
        String deleteOperationErrors = '';

        if(Schema.sObjectType.Case.isDeletable()) {
            List<Case> recordsToBeDeleted = [SELECT Id FROM Case WHERE Id IN :recordsId];

            Database.DeleteResult[] deleteOperationResults = Database.delete(recordsToBeDeleted, false);

            for(Database.DeleteResult deleteResult : deleteOperationResults) {
                for(Database.Error deleteError : deleteResult.getErrors()) {
                    deleteOperationErrors += deleteError.getMessage();
                }
            }
        } else {
            deleteOperationErrors += 'The user can\'t delete case records';
        }

        return deleteOperationErrors;
    }
}