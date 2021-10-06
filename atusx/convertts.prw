
#include "protheus.ch"

User function ConvertTs()

Local aDir      AS ARRAY 

Local nFor      AS NUMERIC 

Local cCaminho  AS CHARACTER
Local cCont     AS CHARACTER

cCaminho := cGetFile('*.ts',"Selecione a pasta",,'C:\',.T.,nOr(GETF_RETDIRECTORY, GETF_LOCALHARD),.F.,.F.) 

aDir := Directory( cCaminho + "*ruru.TS" )

For nFor := 1 to Len( aDir )

	cFile := cCaminho + aDir[ nFor, 1 ]

	cCont := MemoRead( cFile )

	cCont := Encodeutf8( cCont, "cp1251" )

	cCont := MemoWrit( cFile, cCont )

Next nFor 

return 
