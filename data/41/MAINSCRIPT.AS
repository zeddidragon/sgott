///
/// メインスクリプト（各種モードへ分岐するまでを担当）
///
/// $HeadURL$
/// $Id$
///

#include "CommonTypes.h"

// int __game_show_mode;
//int slot_mode_select_fade_handle = -1;	//
//int g_bg_handle = -1;

enum MissionResult{
	MISSION_RESULT_UNKNOWN,
	MISSION_RESULT_CLEAR,
	MISSION_RESULT_ABORT,
	MISSION_RESULT_RETRY,
	MISSION_RESULT_LOBBY,
	MISSION_RESULT_MAX,
};

enum ResouceSystemGroup{
	SYSTEM_GROUP_TITLE,		// タイトル起動から終了まで常駐し続けるリソース用
	SYSTEM_GROUP_MODE,		// ゲームモード単位で常駐するリソース用
	SYSTEM_GROUP_SCENE,		// シーン単位のリソース（進行画面毎やミッション毎等）
};


int main()
{
	string current_routine = "Boot"; // 最初にコルーチン呼び出しを行う関数を登録しておく

	if( GetStartupRoutine().length() > 0 ) {
		print( "[" + GetStartupRoutine() + "] changed" );
		current_routine = GetStartupRoutine();
	}

	while( true ) {
		// 正式な呼び出し型情報を作成する
		string exec = "string " + current_routine + "()";
		//print(exec);
		// コルーチン呼び出し
		coRoutine routine = createCoRoutine(exec);
		// コルーチンが完了するまで待つ
		routine.wait();
		// コルーチンから戻り値を取り出す
		current_routine = routine.resultString();

		// exitであれば抜ける
		if( "exit" == current_routine ) {
			break;
		}
	}

	return 0;
}


/**
 * BGM管理
 */
class Music {
	string m_current_bgm;

	// BGM再生リクエスト、再生中と同じBGMの場合は何もしない
	void Play(string name) {
		if( m_current_bgm != name ) {
			PlayBgm( name );			// BGM:タイトル画面
			m_current_bgm = name;
		}
	}
	// BGMをフェード後停止
	void Stop(int tm) {
		StopBgmFadeout( tm );
		m_current_bgm = "";
	}
};
/**
 * BG表示管理
 */
class BG {
	string m_current_bg;

	// BG再生リクエスト、再生中と同じBGMの場合は何もしない
	void Play(string name) {
		if( m_current_bg != name ) {
			DeleteBg();
			CreateBg(name);
			m_current_bg = name;
		}
	}
	// BGをフェード後停止
	void Stop() {
		DeleteBg();
		m_current_bg = "";
	}

	// 単純に状態をクリアする
	void Clear() {
		m_current_bg = "";
	}
};

int		g_music_fadetime = 60;
Music	g_music = Music();

BG 		g_bg = BG();

// void MessageDialog_Sample()
// {
// 	// 文字列部分は ResourceManager::GetText のキーとして使用されるので、
// 	// このサンプルコードだけでは下記コードの文字は表示出来ない事に注意。
// 	Dialog_Message( "タイトル", "メッセージ" );
// 	switch( Dialog_YesNo( "YES／NO　ダイアログ", "メッセージ", DIALOG_FLAG_DEFAULT_NO ) ){
// 		case DIALOG_RESULT_OK_YES:
// 			Dialog_Message( "", "YESを選択" );
// 			break;
// 		case DIALOG_RESULT_NO:
// 			Dialog_Message( "", "NOを選択" );
// 			break;
// 		case DIALOG_RESULT_CANCEL:
// 			Dialog_Message( "", "キャンセル" );
// 			break;
// 	}
// }


// モードセレクト後のデータロード処理
bool	LoadSaveData_ModeSelect()
{
	ModeSelectLoadSaveData();
	WaitSaveLoad();
	return IsCompleteSaveLoad();
}

// スロットセレクトの準備のためのデータロード処理
bool	LoadSaveData_PreSlotSelect()
{
	TitleLoadSaveData();
	WaitSaveLoad();
	return IsCompleteSaveLoad();
}

// セーブ処理
bool	SaveAllData(bool is_focus)
{
	Save(is_focus, "Contents_AutoSaveRetry");
	WaitSaveLoad();
	return IsCompleteSaveLoad();
}	

// タイトルに戻る際のセーブ
bool	SaveAllData_ReturnTitle(bool is_focus)
{
	Save(is_focus, "Contents_AutoSaveRetry_ReturnTitle");
	WaitSaveLoad();
	return IsCompleteSaveLoad();	
}


//===============================================================================
// 再起動
string ReBoot()
{
	g_music.Stop( 1 );
	// ジョブのコールバック等が仕掛けられている可能性があるので、ジョブの終了を待つ
	WaitJob();
	// 完全リセット
	// マップ、UI、リソースの解放、サウンドの停止、ネットワークの停止等、システム系のリセットが行われる
	// ゲームの進行状況は別途 Reset を呼び出す
	SystemReset();	
	
	return "Boot";
}


//===============================================================================
// 起動
string Boot()
{
	WaitJob();
	Reset( RESET_FLAG_ALL );

	
	if( IsInvite() ){
		return "Invite";
	}

	return "Title";
}


//===============================================================================
// 招待処理
//  とりあえず失敗したらTitleに戻している
string Invite()
{
	ResetControllerAssign();	// プレイヤーを一人に設定

	// 企業ロゴ表示
	CompanyLogo();

	// PlayGoチェック
	if( false == IsDownloadComplete() ) {
		Dialog_Message( "","PlayGoDownload_Invitation" );
		return "Title";
	}

	TitleScene();

	// スロット、モード選択共通。モード選択側で解放
	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/MenuResourceGroup_SlotModeSelect.sgo", SYSTEM_GROUP_SCENE, 0 );
	LoadResource("app:/Menu/SaveBG.sgo", SYSTEM_GROUP_SCENE, 0);
	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了

	g_music.Play( "BGM_E4S01_TitleGamen" );			// BGM:タイトル画面

	CreateFadeUi("ui_fade_screen_test");
	FadeUiControl( FADE_CONTROL_OUT_TO_IN, 0.5 );

	g_bg.Play("app:/Menu/SaveBG.sgo");	// 背景。モード選択で閉じる

	WaitSaveLoad();	// 戻ってくる際のセーブ処理待機
	SearchUpdateAddon();	//追加コンテンツの更新開始
//	LoadSystemCommonAll();	// システムコンフィグとスロット4つ分のデータ読み込み
	if( LoadSaveData_PreSlotSelect() == false )
	{
		Dialog_Message( "","Sys_LoadFailed_ToTitle" );

		// ロードエラーはどうにもならないので、タイトルに戻す
		FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.5 );
		WaitFadeUiComplete();
		DeleteFadeUi();

		g_bg.Stop();	// 背景を閉じる
		g_music.Stop(g_music_fadetime);
		FreeResourceGroup( RESOURCE_GROUP_SCENE );	// リソース解放
		return "Title";
	}
	WaitSearchUpdateAddon();	//追加コンテンツの更新終了を待つ

	int mode = GetInvitationMode();
	// パッケージを持っているかチェック
	if( mode < 0 ) {
		// Sys_InviteCancel
		Dialog_Message( "","Sys_JoinGameCancel" );

		FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.5 );
		WaitFadeUiComplete();
		DeleteFadeUi();

		g_bg.Stop();	// 背景を閉じる
		g_music.Stop(g_music_fadetime);
		FreeResourceGroup( RESOURCE_GROUP_SCENE );	// リソース解放

		return "Title";
	}


	// スロットをユーザーに選択させて、選択してモードを強制設定。
	// オンラインシナリオへ移行する。
	Reset( RESET_FLAG_SLOT_RESET );

	int ui_handle = CreateSlotSelectUi(UISLOTSELECT_INVITATION);
	WaitAllUiClose();
	
	// 招待状に設定されているモードに設定
	FreeResourceGroup( RESOURCE_GROUP_MODE );
	SetMode(mode);

	// モード、ゲーム、実績データ読み込み
	if( LoadSaveData_ModeSelect() == false ){
		Dialog_Message( "","Sys_LoadFailed_ToTitle" );

		// ロードエラーはどうにもならないので、タイトルに戻す
		FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.5 );
		WaitFadeUiComplete();
		DeleteFadeUi();

		g_bg.Stop();	// 背景を閉じる
		g_music.Stop(g_music_fadetime);
		FreeResourceGroup( RESOURCE_GROUP_SCENE );	// リソース解放
		return "Title";
	}
	UnlockDownloadContents();	// ダウンロードコンテンツをアンロック


	return "InviteOnlineMode";
}

//===============================================================================
// タイトル画面
void TitleScene()
{
	DeleteAllMenuUi();	// 念のためUIを掃除
	g_bg.Clear();

	Reset( RESET_FLAG_ALL );
	
	ResetControllerAssign();	// プレイヤーを一人に設定
	
	// タイトルプリロード
	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/MenuResourceGroup_Title.sgo", SYSTEM_GROUP_SCENE, 0 );

	string title_sgo_file = "";
	// [言語変更対応]
	int region_id = GetRegionID();
	switch( region_id ) {
	case _Region_JP:
		title_sgo_file = "app:/Menu/Title.sgo";
		break;
	case _Region_US:
	case _Region_EU:
		title_sgo_file = "app:/Menu/Title_en.sgo";
		break;
	case _Region_CN:
		title_sgo_file = "app:/Menu/Title_cn.sgo";
		break;
	}
	LoadResource(title_sgo_file, SYSTEM_GROUP_SCENE, 0);

	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了
	

	
	CreateFadeUi("ui_fade_screen_test");
	FadeUiControl( FADE_CONTROL_OUT_TO_IN, 0.5 );

//	int ui_handle = CreateUi("ui_title");

	g_bg.Play(title_sgo_file);

	g_music.Play( "BGM_E4S01_TitleGamen" );			// BGM:タイトル画面

	int ui_text_handle = CreateUi("ui_title_text");	// ボタン入力確認UI
	
	WaitSaveLoad();	// 戻ってくる際のセーブ処理待機
	SearchUpdateAddon();	//追加コンテンツの更新開始
	TitleLoadSaveData();	// システムコンフィグとスロット選択用データロード開始
	
	WaitFadeUiComplete();
	WaitUiClose(ui_text_handle);

	// 操作に使用するデバイスの表示(パッドorキーボード)
	Dialog_ControllerMessage();

	// オートセーブ警告表示
	Dialog_TextureMessage( "", "Sys_AutoSaveWarning" );
	
	CloseUi(load_small);	// 右下ローディングアイコン終了
	
	WaitSearchUpdateAddon();	//追加コンテンツの更新終了を待つ
	// ロード終了待機
	WaitSaveLoad();
	if( IsCompleteSaveLoad() == false )
	{
		// ここでのロードは停止しない(エラーはロード処理中で表示)
	}


	// 次の画面へ	
	FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.5 );
	WaitFadeUiComplete();
	DeleteFadeUi();

	g_bg.Stop();
}
//===============================================================================
// 企業ロゴ
void CompanyLogo()
{
	// ロゴを表示したことがない場合のみ処理する
	if( false == IsDisplayLogo() ) {
		int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
		LoadResource("app:/Menu/MenuResourceGroup_CompanyLogo.sgo", SYSTEM_GROUP_SCENE, 0 );
		WaitCompleteResource();
		CloseUi(load_small);	// 右下ローディングアイコン終了

		
		int logo;
		
		int region_id = GetRegionID();
		if( true || region_id  == _Region_JP )
		{
			logo = PlayLogoMovie("app:/Menu/D3LOGO.mp4",true);
			WaitUiClose(logo);
			
			logo = PlayLogoAnimation("app:/Menu/Logo_cri.sgo", true );
			WaitUiClose(logo);

			logo = PlayLogoAnimation("app:/Menu/Logo_havok.sgo", true );
			WaitUiClose(logo);
			
		}
		else
		{
			if( region_id  == _Region_US )
			{
				logo = PlayLogoAnimation("app:/Menu/Logo_xseed.sgo", true);
				WaitUiClose(logo);
			}
			else
			{//	( region_id  == _Region_EU )

				logo = PlayLogoAnimation("app:/Menu/Logo_pqube.sgo", true);
				WaitUiClose(logo);
			}

			logo = PlayLogoMovie("app:/Menu/D3LOGO.mp4",true);
			WaitUiClose(logo);

			logo = PlayLogoAnimation("app:/Menu/Logo_cri.sgo", true);
			WaitUiClose(logo);

			logo = PlayLogoAnimation("app:/Menu/Logo_havok.sgo", true);
			WaitUiClose(logo);
			
		}
		
		logo = PlayLogoAnimation("app:/Menu/Logo_sandlot.sgo", true );
		WaitUiClose(logo);

		SetDisplayedLogo(true);
	}
}


//===============================================================================
// タイトル画面
string Title()
{
	// タイトルに戻った段階で招待情報はクリアされる
	ClearInvitation();

	// 企業ロゴ表示
	Dialog_Message( "", "MODDED_WARNING" );
	
	CompanyLogo();

	DeleteAllMenuUi();	// 念のためUIを掃除
	g_bg.Clear();

	Reset( RESET_FLAG_ALL );
	
	ResetControllerAssign();	// プレイヤーを一人に設定
	
	// タイトルプリロード
	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/MenuResourceGroup_Title.sgo", SYSTEM_GROUP_SCENE, 0 );

	string title_sgo_file = "";
	// [言語変更対応]
	int region_id = GetRegionID();
	switch( region_id ) {
	case _Region_JP:
		title_sgo_file = "app:/Menu/Title.sgo";
		break;
	case _Region_US:
	case _Region_EU:
		title_sgo_file = "app:/Menu/Title_en.sgo";
		break;
	case _Region_CN:
		title_sgo_file = "app:/Menu/Title_cn.sgo";
		break;
	}
	LoadResource(title_sgo_file, SYSTEM_GROUP_SCENE, 0);

	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了
	

	
	CreateFadeUi("ui_fade_screen_test");
	FadeUiControl( FADE_CONTROL_OUT_TO_IN, 0.5 );

//	int ui_handle = CreateUi("ui_title");

	g_bg.Play(title_sgo_file);

	g_music.Play( "BGM_E4S01_TitleGamen" );			// BGM:タイトル画面

	int ui_text_handle = CreateUi("ui_title_text");	// ボタン入力確認UI
	
	WaitSaveLoad();	// 戻ってくる際のセーブ処理待機
	SearchUpdateAddon();	//追加コンテンツの更新開始
	TitleLoadSaveData();	// システムコンフィグとスロット選択用データロード開始
	
	WaitFadeUiComplete();
	WaitUiClose(ui_text_handle);

	// 操作に使用するデバイスの表示(パッドorキーボード)
	Dialog_ControllerMessage();

	// オートセーブ警告表示
	Dialog_TextureMessage( "", "Sys_AutoSaveWarning" );
	
	CloseUi(load_small);	// 右下ローディングアイコン終了
	
	WaitSearchUpdateAddon();	//追加コンテンツの更新終了を待つ
	// ロード終了待機
	WaitSaveLoad();
	if( IsCompleteSaveLoad() == false )
	{
		// ここでのロードは停止しない(エラーはロード処理中で表示)
	}


	// 次の画面へ	
	FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.5 );
	WaitFadeUiComplete();
	DeleteFadeUi();

	g_bg.Stop();
	
	return "SlotSelect";
}



//===============================================================================
// スロット選択
string SlotSelect()
{
	Reset( RESET_FLAG_SLOT_RESET );

	// スロット、モード選択共通。モード選択側で解放
	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/MenuResourceGroup_SlotModeSelect.sgo", SYSTEM_GROUP_SCENE, 0 );
	LoadResource("app:/Menu/SaveBG.sgo", SYSTEM_GROUP_SCENE, 0);
	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了

	
	CreateFadeUi("ui_fade_screen_test");
	FadeUiControl( FADE_CONTROL_OUT_TO_IN, 0.5 );

	g_bg.Play("app:/Menu/SaveBG.sgo");	// 背景。モード選択で閉じる

	int ui_handle = CreateSlotSelectUi(UISLOTSELECT_NORMAL);
	WaitAllUiClose();
	
	if( GetUiExitCode() ==  UISLOTSELECT_RESULT_OK)
	{
		return "ModeSelect";
	}
	else
	{
		FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.5 );
		WaitFadeUiComplete();
		DeleteFadeUi();

		g_bg.Stop();	// 背景を閉じる
		FreeResourceGroup( RESOURCE_GROUP_SCENE );	// リソース解放
		return "Title";
	}
}


//===============================================================================
// モード選択
string ModeSelect()
{
	Reset( RESET_FLAG_MODE_RESET );

	int ui_handle = CreateUi("ui_modeselect");
	WaitAllUiClose();
	
	// 画面分割時はトロフィーに関する警告表示
	if( PlayerCount() > 1 ){
		Dialog_Message( "","GameMode_Warning2Player" );
	}

	// モードステータスロード(キャンセルでなかったら実行)
	if( GetUiExitCode() == UIMODESELECT_RESULT_CANCEL ){
		DeleteFadeUi();
		g_bg.Stop();
		return "SlotSelect";
	}
	
	// モード設定
	FreeResourceGroup( RESOURCE_GROUP_MODE );
	SetMode(GetUiExitCode());	// キャンセルで除外されてなければゲームモードIDが帰ってくる

	// モード、ゲームデータ読み込み
	if( LoadSaveData_ModeSelect() == false ){
		// エラーがあったのでスロットセレクトに
		Dialog_Message( "","Sys_LoadFailed_ToSlotSelect" );
		DeleteFadeUi();
		g_bg.Stop();
		return "SlotSelect";		
	}
	
	UnlockDownloadContents();	// ダウンロードコンテンツをアンロック
	UpdateAchievementCounter( false );
	AchievementAddCount("PlayCount");	// ゲーム開始回数

	g_music.Stop(g_music_fadetime);

	FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.5 );
	WaitFadeUiComplete();
	DeleteFadeUi();

	g_bg.Stop();	// 背景を閉じる（開始はスロット選択）

	FreeResourceGroup( RESOURCE_GROUP_SCENE );	// リソース解放

	switch( GetGameMode() ) { // 選択されたゲームモードに合わせて分岐（命令追加）
	case GAME_OFFLINE_SCENARIO:
		return "MainMenu";
	case GAME_ONLINE_SCENARIO:
		return "OnlineMode";
	case GAME_VERSUS:
		return "VersusMode";
	default:
		break;
	}
	return "SlotSelect";
}


//===============================================================================
// メインメニュー(本部画面)
string MainMenu()
{
	DeleteAllMenuUi();	// 念のためUIを掃除
	g_bg.Clear();


	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/MissionClear.sgo", SYSTEM_GROUP_MODE, 0 );
	LoadResource("app:/Menu/MissionFailed.sgo", SYSTEM_GROUP_MODE, 0 );
	LoadResource("app:/Menu/MenuResourceGroup_HQ.sgo", SYSTEM_GROUP_SCENE, 0 );
	LoadResource("app:/Menu/Menu_BG01.sgo", SYSTEM_GROUP_SCENE, 0);
	LoadMissionImageResource( 0 );
	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了



	
	g_bg.Play("app:/Menu/Menu_BG01.sgo");
	int ui_handle = Create3DModelUi("ui_hq");


	CreateFadeUi("ui_fade_screen_test");
	FadeUiControl( FADE_CONTROL_OUT_TO_IN, 0.5 );

	g_music.Play( GetMainMenuBgm() );	// BGM:メニュー画面
	WaitAllUiClose();
	g_music.Stop( g_music_fadetime );

	FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.5 );
	WaitFadeUiComplete();
	DeleteFadeUi();

	g_bg.Stop();		// BGは自動で閉じないので直接閉じさせる。

	FreeResourceGroup( RESOURCE_GROUP_SCENE );

	if( GetUiExitCode() == UIHQ_GOTO_MISSION ){
		return "PlayMission_Offline";
	}else{
		// セーブ
		if( SaveAllData_ReturnTitle(true) == false )
		{
			// セーブに失敗
		}
		
		// タイトルへ
		return "Title";
	}

}


//===============================================================================
// ミッション共通処理
int PlayMission_Common()
{
	DeleteAllMenuUi();	// 念のためUIを掃除
	g_bg.Clear();

	FreeResourceGroup( RESOURCE_GROUP_SCENE );

	SoldierTypeSortieAddCount();	// 兵科ごとの出撃回数カウントアップ

	// ネットワークの現在位置を更新する(エラー表示用)
	Network_SetLocation(GAME_LOADING);

	if( false == Network_Wait_MissionSync() ) {
		Dialog_Message("","Online_Game_Disconnect");
		/// 通信に失敗したので、ロビーへ戻されます
		/// 切断済みになっていますが、GAME_LOADINGなのでメッセージの表示が必要です。
		return MISSION_RESULT_LOBBY;
	}

	SetUsedWeapon();
	
	int result;
	for(;;){
		// ネットワークのゲームセッションをリセットする(ローカルの状態をリセットする)
		Network_Session_Reset();

		result = Mission();
		if( result != MISSION_RESULT_RETRY) break;
	}

	if( result == MISSION_RESULT_CLEAR ) {
		if( false == Network_Wait_ResultSync() ) {
			/// 通信に失敗したので、ロビーへ戻されます、エラーは自動的に表示されています
			return MISSION_RESULT_LOBBY;
		}
	}

	// ネットワークのゲームセッションを終了する
	Network_Session_End();

	// ネットワークの現在位置を更新する(エラー表示用)
	Network_SetLocation(GAME_LOADING);

//	// ゲームが終わった後は特殊な解放が必要なので、専用処理を呼び出す
//	ReleaseGameResource(); // FreeResourceGroup を拡張するべき案件なので、ReleaseGameResourceは破棄：野口
	FreeResourceGroup( RESOURCE_GROUP_SCENE );


	return result;
}


//===============================================================================
// オフラインミッション
string PlayMission_Offline()
{
	AchievementAddCount("OfflinePlayCount");	// オフラインミッション開始回数

	
	// デモの再生
	FreeResourceGroup( RESOURCE_GROUP_SCENE );
	Before();
	FreeResourceGroup( RESOURCE_GROUP_SCENE );

	
	Chat_Create();
	int result = PlayMission_Common();
	Chat_Destroy();

	if( result == MISSION_RESULT_CLEAR )
	{
		return "Result_Offline";
	}else{
		return "MainMenu";
	}
}


//===============================================================================
// オンラインミッション
string PlayMission_Online()
{
	AchievementAddCount("OnlinePlayCount");	// オンラインミッション開始回数	
	
	int result = PlayMission_Common();

	if( result == MISSION_RESULT_CLEAR ){
		return "Result_Online";
	}else{
		// ルームとの通信が出来ている場合のみルームに戻す
		if( Network_IsRoomConnected() ) {
			return "Room";
		}
	}

	Chat_Destroy();
	// 
	Test_Network_LeaveRoom();

	// セーブ
	if( SaveAllData(true) == false ){
		// セーブ失敗
	}
	return "PreLobby";
}


//===============================================================================
// ミッションリザルト画面
string Result()
{

	int ui_handle = CreateUi("ui_missionresult" );
	WaitAllUiClose();
	
	return "MainMenu";
}

//===============================================================================
// ミッションリザルト画面
void Result_Common()
{
	DeleteAllMenuUi();	// 念のためUIを掃除
	g_bg.Clear();

	g_bg.Play("app:/Menu/Menu_BG01.sgo");	// 背景表示

	ResolveResult();	// ドロップアイテムを確定
	int ui_handle = CreateUi("ui_missionresult" );
	g_music.Play( GetMainMenuBgm() );

	ApplyResult();	// ミッション結果を反映
	UpdateAchievementCounter( true );

	// 武器制限アンロックチェック
	CheckUnlockArmorWeaponLimit();

	Save(false, "Contents_AutoSaveRetry");	// セーブ開始	
	WaitUiClose(ui_handle);

	WaitSaveLoad();
	if( IsCompleteSaveLoad() == false ){
		// セーブ失敗
	}

	ClearResult();		// ドロップアイテムをクリア
}
//===============================================================================
// オフライン用ミッションリザルト
string Result_Offline()
{
	// エンディング
	if( GetContentID() == 0 ){
		int handle = Ending(true);
		if( handle != 0 ){
			g_music.Play( "BGM_E4S08_EndingTelop" );
			WaitUiClose(handle);
			g_music.Stop(1);

			handle = EndCredit(true);	// エンディング入ったらつづけてクレジット
			g_music.Play( "BGM_E4S06_StaffRoll" );
			WaitUiClose(handle);
			g_music.Stop(1);
		}
	}
	else{
		// ＤＬＣミッションパックではオンライン用エンディングを流す
		int handle = OnlineEnding(true);
		if( handle != 0 ){
			g_music.Play( "Jingle_OnlineClearedFinal" );
			WaitUiClose(handle);
			g_music.Stop(1);
		}
	}
	
	Result_Common();
	
	return "MainMenu";
}
//===============================================================================
// オンライン用ミッションリザルト
string Result_Online()
{
	// オンラインエンディング
	int handle = OnlineEnding(true);
	if( handle != 0 ){
		g_music.Play( "Jingle_OnlineClearedFinal" );
		WaitUiClose(handle);
		g_music.Stop(1);	
	}

	Result_Common();

	return "Room";
}



//===============================================================================
// サーバ選択画面
string _OnlineMode(bool is_invitation)
{
	DeleteAllMenuUi();	// 念のためUIを掃除
	g_bg.Clear();

	// BGリソースだけ先行して必要なのでロードする
	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/Menu_BG01.sgo", SYSTEM_GROUP_SCENE, 0);
	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了

	g_bg.Play("app:/Menu/Menu_BG01.sgo");

	// この関数以降基本的に強制的にタイトルに戻される全体リセットが発生します。管理されていないメモリとかないようにしてください。
	g_music.Play( "BGM_E4S04_OnlineLobby" );	// BGM:メニュー画面

	int result_code;

	// とりあえずプリロード可能な情報がある場合はここでやっておく
	LoadResource("app:/Menu/MenuResourceGroup_Lobby.sgo", SYSTEM_GROUP_SCENE, 0);
	if( is_invitation ) {
		// この段階で(失敗しなければ)ルームに行くのが確定している
		LoadResource("app:/Menu/MenuResourceGroup_Room.sgo", SYSTEM_GROUP_SCENE, 0);
		// Modeも決定済み
		LoadMissionImageResource(0);
	}

	Network_SetLocation(GAME_LOADING);
	int extra_error_code = 0;
	result_code = Network_PreCheck(extra_error_code);
	if( 0 == extra_error_code && NETWORKBEGINRESULT_NO_PLUS == result_code ) {
		CreateUi("ui_plus_commerce");
		WaitAllUiClose();

		if( 0 == GetUiExitCode() ) {
			// システム側で表示されているので、不要
			//Dialog_Message( "","" );

			g_music.Stop( g_music_fadetime );
			Network_End();

			g_bg.Stop();

			// エラーの場合はオンラインモードから抜ける
			return "Title";
		} else {
			// PLUS:成功
			result_code = NETWORKBEGINRESULT_SUCCESS;
		}
	}

	// 接続中待機ウインドウ作成
	int wait_ui_handle = CreateWaitUi("Online_NameVerify");

	// 接続処理呼び出し
	if( NETWORKBEGINRESULT_SUCCESS == result_code ) {
		result_code = Network_Begin();
	}

	// 名前チェック
	if( NETWORKBEGINRESULT_SUCCESS == result_code ) {
		result_code = Network_NameCheck();
	}

	// エラー判定
	if( NETWORKBEGINRESULT_SUCCESS != result_code ) {
		// 待機ウインドウを消す
		CloseUi(wait_ui_handle);
		WaitUiClose(wait_ui_handle);

		switch( result_code ) {
		case NETWORKBEGINRESULT_NO_SIGNIN:
			Dialog_Message( "","GameMode_NoSignin" );
			break;
		case NETWORKBEGINRESULT_FAILED:
			{
				int handle = CreateErrorDialog("GameMode_OnlineFailed",extra_error_code);
				WaitUiClose(handle);
			}
			break;
		case NETWORKBEGINRESULT_PARENTAL:
			Dialog_Message( "","GameMode_OnlineCantUse" );
			break;
		case NETWORKBEGINRESULT_IRRELEVANT_NAME:
			Dialog_Message( "","Online_NameVerifyError" );
			// 名前がダメなので、必ずタイトルに戻る
			break;
		}
		g_music.Stop( g_music_fadetime );
		Network_End();

		g_bg.Stop();

		// エラーの場合はオンラインモードから抜ける
		return "Title";
	}

	// 一定時間は待ってからダイアログを消す
	Wait( 60 );

	// 待機ウインドウを消す
	CloseUi(wait_ui_handle);

	// 年齢チェックを行い、必要であればチャット禁止などの警告を出す必要がある。
	if( false == Network_IsCommunications() ) {
		int chat_restriction = Network_GetChatRestrictType();
		if( RESTRICT_CHAT == (chat_restriction & RESTRICT_CHAT) ) {
			// チャット禁止
			int ui = CreateChatRestrictUI( 0 );
			WaitUiClose(ui);
		}
		if( RESTRICT_UGC == (chat_restriction & RESTRICT_UGC) ) {
			// UGC禁止
			int ui = CreateChatRestrictUI( 1 );
			WaitUiClose(ui);
		}
	}

	if( is_invitation ) {
		/// ルーム参加開始
		CreateUi("ui_invite_join");
		WaitAllUiClose();

		int ret = GetUiExitCode();

		// 招待情報をクリア
		ClearInvitation();

		// 参加チェック
		switch( ret ) {
		case NETWORKJOINRESULT_SUCCESS:
			break;
		case NETWORKJOINRESULT_CHAT_RESTRICTION:
			Dialog_Message( "","Lobby_Chat_NotInvite" );
			return "Title";
		case NETWORKJOINRESULT_UGC_RESTRICTION:
			Dialog_Message( "","Lobby_UGC_NotInvite" );
			return "Title";
		case NETWORKJOINRESULT_FAILED:
			Dialog_Message( "","OnlineError_RoomError" );
			return "Title";
		case NETWORKJOINRESULT_FILLED:
			Dialog_Message( "","OnlineError_RoomFull" );
			return "Title";
		}

		/// 
		return "PreRoom";
	}

	return "PreLobby";
}


/// 招待モード
string InviteOnlineMode()
{
	return _OnlineMode(true);
}

/// 通常
string OnlineMode()
{
	return _OnlineMode(false);
}

//===============================================================================
// ルーム画面(初期化用)
string PreLobby()
{
	Chat_Destroy();
	return "Lobby";
}

//===============================================================================
// ロビー画面
string Lobby()
{
	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/MenuResourceGroup_Lobby.sgo", SYSTEM_GROUP_SCENE, 0);
	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了

	g_bg.Play("app:/Menu/Menu_BG01.sgo");

	// ロビー画面のＵＩ表示
	// memo ロビー画面は常にルームリストの更新中フラグを監視して、更新中であればダイアログを表示する機能が必要。
	// memo ルームに入る場合も同じような画面が必要。
	// memo 招待、パーティの確認機能が必要
	//CreateUi( "" );

	Network_SetLocation(MENU_LOBBY);
	
	string result = "";
	
	int ui_handle = CreateUi("ui_online_lobby");
	g_music.Play( "BGM_E4S04_OnlineLobby" );	// BGM:メニュー画面

	int message_id;
	int wparam;
	while( GetUIMessage(ui_handle,message_id,wparam) ) {
		switch( message_id ) {
		case LOBBY_LOADMODEDATA_REQUEST:
			{
				WaitCompleteResource();
				FreeResourceGroup( RESOURCE_GROUP_MODE );
				// DLCコンテンツIDが一緒に返ってくるので初期化する
				int mode_no = wparam;
				SetMode(mode_no);

				LoadMissionImageResource(0);

				// モード、ゲーム、実績データ読み込み
				if( LoadSaveData_ModeSelect() ){
					int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
					UnlockDownloadContents();	// ダウンロードコンテンツをアンロック
					UpdateAchievementCounter( false );

					WaitCompleteResource();
					CloseUi(load_small);	// 右下ローディングアイコン終了

					PostUIMessage(LOBBY_LOADMODEDATA_DONE,1);
				} else {
					PostUIMessage(LOBBY_LOADMODEDATA_DONE,0);
				}
			}
			break;
		}
	}

	WaitAllUiClose();

	int exit_code = GetUiExitCode();

	switch( (exit_code&0xf) ){
	case NETWORKLOBBYMENU_CREATEROOM:
		result = "SelectDLCContents";	
		break;
	
	case NETWORKLOBBYMENU_RETURN_TITLE:
		// 接続終了コード
		Network_End();
		g_bg.Stop();
		g_music.Stop(g_music_fadetime);
		result = "Title";
		break;
	case NETWORKLOBBYMENU_RETURNWORLDSELECT:
		// 接続終了コード
		Network_End();
		g_bg.Stop();
		g_music.Stop(g_music_fadetime);
		result = "Title";
		break;
		
	case NETWORKLOBBYMENU_JOINROOM:
		{
			FreeResourceGroup( RESOURCE_GROUP_MODE );
			// DLCコンテンツIDが一緒に返ってくるので初期化する
			int mode_no = (exit_code >> 8);
			SetMode(mode_no);

			LoadMissionImageResource(0);

			// モード、ゲーム、実績データ読み込み
			if( LoadSaveData_ModeSelect() == false ){
				Dialog_Message( "","Sys_LoadFailed_ToTitle" );

				// エラーがあったのでタイトルに戻す
				Network_End();
				g_bg.Stop();
				g_music.Stop(g_music_fadetime);
				return "Title";
			}
			UnlockDownloadContents();	// ダウンロードコンテンツをアンロック
			UpdateAchievementCounter( false );
		}
		g_music.Stop( g_music_fadetime );
		result = "PreRoom";
		break;
	}

	
//	result = "CreateRoom";
	// とりあえず接続済みであればルーム画面へ移動させる
//	if( Network_IsRoomJoined() ) {
//		result = "Room";
//	}

//	WaitAllUiClose();

	// プレイヤーの選択で少なくとも以下に分岐する
	return result;
	//return "CreateRoom";
	//return "Room";
	//return "Title";
}
//===============================================================================
// ルーム作成画面
string CreateRoom()
{
	// とりあえずプリロードだけ開始しておく
	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadMissionImageResource(0);
	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了

	// ルーム画面のプリロード開始
	LoadResource("app:/Menu/MenuResourceGroup_Room.sgo", SYSTEM_GROUP_SCENE, 0);

	// ルーム作成画面ＵＩ表示
	// memo ルームに入る前には同期待ちダイアログ必要
	// memo このＵＩはルーム検索画面として配置を微妙にいじって再利用される可能性が高いです。そのつもりでつくっておいた方がよいです。
	//CreateUi( "" );

	CreateUi( "ui online_createroom" );
	WaitAllUiClose();

	int exit_code = GetUiExitCode();

	string result = "";
	switch( exit_code ){
	case NETWORKCREATEROOM_SUCCESS:
		// とりあえずルームを作成する、本来はUI側での処理が必要。
		g_music.Stop( g_music_fadetime );
		result = "PreRoom";	
		break;
		
	case NETWORKCREATEROOM_CANCEL:
		result = "Lobby";	
		break;
		
	case NETWORKCREATEROOM_RETURN_TITLE:
		result = "Title";	
		break;
	}

	return result;
}

//===============================================================================
// ルーム作成画面(前)
string SelectDLCContents()
{
	// デフォルトのモード番号を取得しておく
	int mode_no = GetModeNo(GAME_ONLINE_SCENARIO,0);

	if( 1 < GetModeTypeContentsCount(GAME_ONLINE_SCENARIO) ) {
		// コンテンツが複数ある場合はモード選択を行う
		int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
		LoadResource("app:/Menu/MenuResourceGroup_SlotModeSelect.sgo", SYSTEM_GROUP_SCENE, 0 );
		WaitCompleteResource();
		CloseUi(load_small);	// 右下ローディングアイコン終了

		// 複数のコンテンツを持っている場合はモード選択画面を出す
		int ui_handle = CreateUi("ui_onlinemodeselect");
		WaitAllUiClose();
	
		// モードステータスロード(キャンセルでなかったら実行)
		if( GetUiExitCode() == UIMODESELECT_RESULT_CANCEL ){
			return "PreLobby";
		}

		mode_no = GetUiExitCode();
	}

	if( mode_no >= 0 ) {
		FreeResourceGroup( RESOURCE_GROUP_MODE );
		// DLCパッケージが選択されたので、適応する
		SetMode(mode_no);

		LoadMissionImageResource(0);

		// モード、ゲーム、実績データ読み込み
		if( LoadSaveData_ModeSelect() == false ){
			Dialog_Message( "","Sys_LoadFailed_ToTitle" );
			// エラーがあったのでタイトルに戻す
			Network_End();
			g_bg.Stop();
			g_music.Stop(g_music_fadetime);
			return "Title";
		}
		UnlockDownloadContents();	// ダウンロードコンテンツをアンロック
		UpdateAchievementCounter( false );
	} else {
		// 0未満はキャンセル動作扱い
		return "PreLobby";
	}

	return "CreateRoom";
}

//===============================================================================
// ルーム画面(初期化用)
string PreRoom()
{
	Chat_Create();
	return "Room";
}

//===============================================================================
// ルーム画面
string Room()
{
	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/MenuResourceGroup_Room.sgo", SYSTEM_GROUP_SCENE, 0);
	LoadMissionImageResource(0);
	LoadResource("app:/Menu/MissionClear.sgo", SYSTEM_GROUP_MODE, 0 );
	LoadResource("app:/Menu/MissionFailed.sgo", SYSTEM_GROUP_MODE, 0 );
	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了

	g_bg.Play("app:/Menu/Menu_BG01.sgo");

	Network_SetLocation(MENU_ROOM);

	// ルーム画面ＵＩ表示
	// memo 自フレンドの招待/パーティ招待機能が必要、昔チャットに付いていた機能でTRC的によいはず。
	int handle = Create3DModelUi( "ui_online_room" );
	g_music.Play( GetMainMenuBgm() );	// BGM:メニュー画面
	WaitUiClose( handle );
	g_music.Stop( g_music_fadetime );

	int exit_code = GetUiExitCode();
	print("ui_online_room exit code["+exit_code+"]");
	switch( exit_code ){
	case UIONLINE_GOTO_MISSION:
		g_bg.Stop();
		//CloseUi( g_bg_handle );
		return "PlayMission_Online";
	case UIONLINE_GOTO_LOBBY:
		Chat_Destroy();
		Test_Network_LeaveRoom();
		// セーブ
		if( SaveAllData(true) == false ){
			// セーブ失敗
		}
		return "PreLobby";
	default:
		print("ハンドルされていないリザルトコードが返ってきています ["+exit_code+"]");
		break;
	}

	Chat_Destroy();
	Test_Network_LeaveRoom();
	// セーブ
	if( SaveAllData(true) == false ){
		// セーブ失敗
	}
	return "PreLobby";
}



//===============================================================================
// 対戦メニュー画面
string VersusMode()
{
	DeleteAllMenuUi();	// 念のためUIを掃除
	g_bg.Clear();

	int load_small = CreateLoadingSmallIcon();	// 右下ローディングアイコン
	LoadResource("app:/Menu/Menu_BG01.sgo", SYSTEM_GROUP_SCENE, 0);
	LoadResource("app:/ETC/VersusMap.sgo", SYSTEM_GROUP_MODE, 0);
	LoadResource("app:/Menu/VS_1PWin.sgo", SYSTEM_GROUP_MODE, 0);
	LoadResource("app:/Menu/VS_2PWin.sgo", SYSTEM_GROUP_MODE, 0);
	LoadResource("app:/Menu/VS_Draw.sgo", SYSTEM_GROUP_MODE, 0);
	LoadResource("app:/Menu/MenuResourceGroup_Versus.sgo", SYSTEM_GROUP_SCENE, 0);
	WaitCompleteResource();
	CloseUi(load_small);	// 右下ローディングアイコン終了



	g_bg.Play("app:/Menu/Menu_BG01.sgo");
	int ui_handle = Create3DModelUi("ui_versus");

	CreateFadeUi("ui_fade_screen_test");
	FadeUiControl( FADE_CONTROL_OUT_TO_IN, 0.5 );

	g_music.Play( GetMainMenuBgm() );	// BGM:メニュー画面
	WaitAllUiClose();
	g_music.Stop( g_music_fadetime );

	FadeUiControl( FADE_CONTROL_IN_TO_OUT, 0.8 );
	WaitFadeUiComplete();
	DeleteFadeUi();

	g_bg.Stop();
	
	FreeResourceGroup( RESOURCE_GROUP_SCENE );
	int save_handle;
	int exit_code = GetUiExitCode();
	switch( exit_code ){
	case UIVERSUS_GOTO_BATTLE:
		return "PlayVersus";			// 対戦開始
	case UIVERSUS_GOTO_TITLE:
		// セーブ
		if(SaveAllData_ReturnTitle(true) == false){
			// 失敗
		}
		return "Title";			// タイトルに戻る
	}
	
	
	// セーブ
	if(SaveAllData_ReturnTitle(true) == false){
		// 失敗
	}
	return "Title";
}

//===============================================================================
// 対戦
string PlayVersus()
{
	DeleteAllMenuUi();	// 念のためUIを掃除
	g_bg.Clear();

	FreeResourceGroup( RESOURCE_GROUP_SCENE );

	int result;
	for(;;){
		result = Versus();
		if( result != MISSION_RESULT_RETRY) break;
	}

	// セーブ
	if(SaveAllData(true) == false){
		// 失敗
	}

	FreeResourceGroup( RESOURCE_GROUP_SCENE );
	return "VersusMode";
}





