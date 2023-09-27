// EDFDecompress.cpp : This file contains the 'main' function. Program execution begins and ends there.
//
//

#include <iostream>
#include <vector>
#include <string>
#include <fstream>

#define _countof(array) (sizeof(array) / sizeof(array[0]))

char* IntToBytes( int i, bool flip )
{
	char* bytes = (char*)malloc( sizeof( char ) * 4 );
	unsigned long n = i;

	if( !flip )
	{
		bytes[ 0 ] = (n >> 24) & 0xFF;
		bytes[ 1 ] = (n >> 16) & 0xFF;
		bytes[ 2 ] = (n >> 8) & 0xFF;
		bytes[ 3 ] = n & 0xFF;
	}
	else
	{
		bytes[ 0 ] = n & 0xFF;
		bytes[ 1 ] = (n >> 8) & 0xFF;
		bytes[ 2 ] = (n >> 16) & 0xFF;
		bytes[ 3 ] = (n >> 24) & 0xFF;
	}

	return bytes;
}

//Read Integer from byte buffer
int ReadInt( std::vector<char>* buf, int pos, bool flipBytes )
{
	unsigned char chunk[ 4 ];

	if( flipBytes )
	{
		chunk[ 0 ] = buf->at( pos );
		chunk[ 1 ] = buf->at( pos + 1 );
		chunk[ 2 ] = buf->at( pos + 2 );
		chunk[ 3 ] = buf->at( pos + 3 );
	}
	else
	{
		chunk[ 3 ] = buf->at( pos );
		chunk[ 2 ] = buf->at( pos + 1 );
		chunk[ 1 ] = buf->at( pos + 2 );
		chunk[ 0 ] = buf->at( pos + 3 );
	}

	int num = 0;
	for( int i = 0; i < 4; i++ )
	{
		num <<= 8;
		num |= chunk[ i ];
	}

	return num;
}

#define BUFFER_SKIP_SIZE 16

//CMPL Decompressor
std::vector< char > SGSLDecompress( std::vector< char > data, bool verbose )
{
	//Check header:
	if( data[ 0 ] != 'S' && data[ 1 ] != 'G' && data[ 2 ] != 'S' && data[ 3 ] != 'L' )
	{
		std::wcout << L"FILE IS NOT SGSL COMPRESSED!\n";
		return data;
	}
	else if( verbose )
		std::wcout << L"BEGINNING DECOMPRESSION\n";

	//Variables
	uint8_t bitbuf;
	uint8_t bitbufcnt;

	std::vector< char > out;

	char mainbuf[ 4096 ];

	int bufPos;

	int desiredSize = ReadInt( &data, 4, false );

	int streamPos = 8;

	//Init buffer:
	for( int i = 0; i < 4096; ++i )
		mainbuf[ i ] = 0;
	bitbuf = 0;
	bitbufcnt = 0;
	bufPos = 3823;

	//Loop
	while( streamPos < data.size() )
	{
		//If bitbuf empty
		if( bitbufcnt == 0 )
		{
			//Read and store in buffer
			bitbuf = data[ streamPos ];
			bitbufcnt = 8;

			++streamPos;
		}

		//if first bit is one, copy byte from input
		if( bitbuf & 0x1 > 0 )
		{
			out.push_back( data[ streamPos ] );
			mainbuf[ bufPos ] = data[ streamPos ];
			bufPos += BUFFER_SKIP_SIZE;
			if( bufPos >= 4096 )
			{
				if( bufPos <= 4110 )
					bufPos = bufPos - 4095;
				if( bufPos >= 4111 )
					bufPos = 0;
			}
				
			++streamPos;
		}
		else //Copy bytes from buffer
		{
			uint8_t chunk[ 2 ];
			chunk[ 1 ] = data[ streamPos + 1 ];
			chunk[ 0 ] = data[ streamPos ];

			streamPos += 2;

			uint16_t val = (chunk[ 0 ] << 8) | chunk[ 1 ];
			int copyLen = (val & 0xf) + 3;
			int copyPos = val >> 4;

			for( int i = 0; i < copyLen; ++i )
			{
				unsigned char byte = mainbuf[ copyPos ];
				out.push_back( byte );
				mainbuf[ bufPos ] = byte;

				bufPos += BUFFER_SKIP_SIZE;
				if( bufPos >= 4096 )
				{
					if( bufPos <= 4110 )
						bufPos = bufPos - 4095;
					if( bufPos >= 4111 )
						bufPos = 0;
				}

				copyPos += BUFFER_SKIP_SIZE;
				if( copyPos >= 4096 )
				{
					if( copyPos <= 4110 )
						copyPos = copyPos - 4095;
					if( copyPos >= 4111 )
						copyPos = 0;
				}
			}
		}

		--bitbufcnt;
		bitbuf >>= 1;
	}

	if( out.size() == desiredSize )
	{
		if( verbose )
			std::cout << "FILE SIZE MATCH! " + std::to_string( desiredSize ) + " bytes expected, got " + std::to_string( (int)out.size() ) + " DECOMPRESSION SUCCESSFUL!\n";
	}
	else
		std::cout << "FILE SIZE MISMATCH! " + std::to_string( desiredSize ) + " bytes expected, got " + std::to_string( (int)out.size() ) + " DECOMPRESSION FAILED!\n";

	return out;
}

//CMPL Compresser
std::vector< char > SGSLCompress( std::vector< char > data, bool bUseFakeCompression = false )
{
	//Declare output
	std::vector< char > out;

	//Fill header:
	out.push_back( 'S' );
	out.push_back( 'G' );
	out.push_back( 'S' );
	out.push_back( 'L' );

	//File size
	char* sizeBytes = IntToBytes( data.size(), false );

	out.push_back( sizeBytes[ 0 ] );
	out.push_back( sizeBytes[ 1 ] );
	out.push_back( sizeBytes[ 2 ] );
	out.push_back( sizeBytes[ 3 ] );

	free( sizeBytes );

	//Begin compression:

	//Use fake compression, faster compile times but extremly ineffecient
	if( bUseFakeCompression )
	{
		std::wcout << L"File using SIMPLE/FAKE Compression.\n";

		//Prepare to format the data into something that the game's CMPL decompressor will read, this data will be trash, not really compressed and is horrible, but just do it anyway.
		int count = 0;
		while( count < data.size() )
		{
			//Push "Copy 8 bits directly" command to reader
			out.push_back( 0b11111111 );

			for( int i = 0; i < 8; ++i )
			{
				if( count >= data.size() )
					break;
				out.push_back( data[ count ] );
				++count;
			}
		}
	}
	else
	{
		//CMPL Compression Algorithm by BlueAmulet, Modified using Stafern's research.
		//std::vector<uint8_t> out;
		std::vector<uint8_t> temp;
		int16_t mainbuf[ 4096 ];
		uint16_t bufPos = 3823;
		size_t streamPos = 0;
		uint8_t bits = 0;

		for( size_t i = 0; i < _countof( mainbuf ); i++ )
		{
			if( i < bufPos )
			{
				mainbuf[ i ] = 0;
			}
			else
			{
				// Mark end of buffer as uninitialized
				mainbuf[ i ] = -1;
			}
		}

		size_t dataSize = data.size();

		while( streamPos < dataSize )
		{
			bits = 0;
			for( size_t i = 0; i < 8; i++ )
			{
				if( streamPos >= dataSize )
				{
					break;
				}
				size_t bestPos = 0;
				size_t bestLen = 0;
				// Try to find match in buffer
				// TODO: Properly support repeating data
				for( size_t jo = 0; jo < _countof( mainbuf ); jo++ )
				{
					int tempBP = bufPos;
					tempBP -= jo * 16;
					while( tempBP < 0 )
						tempBP += 4096;
					if( tempBP >= 4096 )
					{
						if( tempBP <= 4110 )
							tempBP = tempBP - 4095;
						if( tempBP >= 4111 )
							tempBP = 0;
					}

					uint16_t j = tempBP;
					if( mainbuf[ j ] == (int16_t)(uint16_t)data[ streamPos ] )
					{
						size_t matchLen = 0;
						for( size_t k = 0; k < 18; k++ )
						{
							int tempBP2 = j;
							tempBP2 += k * 16;
							if( tempBP2 >= 4096 )
							{
								if( tempBP2 <= 4110 )
									tempBP2 = tempBP2 - 4095;
								if( tempBP2 >= 4111 )
									tempBP2 = 0;
							}

							if( (streamPos + k) < dataSize && tempBP2 != bufPos && mainbuf[ tempBP2 ] == (int16_t)(uint16_t)data[ streamPos + k ] )
							{
								matchLen = k + 1;
							}
							else
							{
								break;
							}
						}
						if( matchLen > bestLen )
						{
							bestLen = matchLen;
							bestPos = j;
						}
					}
				}
				// Repeating byte check

				int tempBP = bufPos;
				tempBP -= 16;
				if( tempBP < 0 )
					tempBP += 4096;
				if( tempBP >= 4096 )
				{
					if( tempBP <= 4110 )
						tempBP = tempBP - 4095;
					if( tempBP >= 4111 )
						tempBP = 0;
				}

				if( mainbuf[ tempBP ] == (int16_t)(uint16_t)data[ streamPos ] )
				{
					size_t matchLen = 0;
					for( size_t k = 0; k < 18; k++ )
					{
						if( (streamPos + k) < dataSize && mainbuf[ tempBP ] == (int16_t)(uint16_t)data[ streamPos + k ] )
						{
							matchLen = k + 1;
						}
						else
						{
							break;
						}
					}
					if( matchLen > bestLen ) {
						bestLen = matchLen;
						bestPos = tempBP;
					}
				}
				// Is copy viable?
				if( bestLen >= 3 )
				{
					// Write copy data
					uint16_t copyVal = bestLen - 3;
					copyVal |= bestPos << 4;
					temp.push_back( copyVal >> 8 );
					temp.push_back( copyVal & 0xFF );
					for( size_t j = 0; j < bestLen; j++ ) {
						mainbuf[ bufPos ] = data[ streamPos ];
						bufPos = (bufPos + 16);
						if( bufPos >= 4096 )
						{
							if( bufPos <= 4110 )
								bufPos = bufPos - 4095;
							if( bufPos >= 4111 )
								bufPos = 0;
						}

						streamPos++;
					}
				}
				else
				{
					// Copy from input
					temp.push_back( data[ streamPos ] );
					mainbuf[ bufPos ] = data[ streamPos ];
					bufPos = (bufPos + 16);
					if( bufPos >= 4096 )
					{
						if( bufPos <= 4110 )
							bufPos = bufPos - 4095;
						if( bufPos >= 4111 )
							bufPos = 0;
					}

					streamPos++;
					bits |= 1 << i;
				}
			}
			out.push_back( bits );
			out.insert( out.end(), temp.begin(), temp.end() );
			temp.clear();
		}
	}

	return out;
}

//CMPL Decompressor
std::vector< char > CMPLDecompress( std::vector< char > data, bool verbose )
{
	//Check header:
	if( data[ 0 ] != 'C' && data[ 1 ] != 'M' && data[ 2 ] != 'P' && data[ 3 ] != 'L' )
	{
		std::wcout << L"FILE IS NOT CMPL COMPRESSED!\n";
		return data;
	}
	else
		std::wcout << L"BEGINNING DECOMPRESSION\n";

	//Variables
	uint8_t bitbuf;
	uint8_t bitbufcnt;

	std::vector< char > out;

	char mainbuf[ 4096 ];

	int bufPos;

	int desiredSize = ReadInt( &data, 4, false );
	int desiredSizeFlipped = ReadInt( &data, 4, true );

	int streamPos = 8;

	//Init buffer:
	for( int i = 0; i < 4078; ++i )
		mainbuf[ i ] = 0;
	bitbuf = 0;
	bitbufcnt = 0;
	bufPos = 4078;

	//Loop
	while( streamPos < data.size() )
	{
		//If bitbuf empty
		if( bitbufcnt == 0 )
		{
			//Read and store in buffer
			bitbuf = data[ streamPos ];
			bitbufcnt = 8;

			++streamPos;
		}

		//if first bit is one, copy byte from input
		if( bitbuf & 0x1 > 0 )
		{
			out.push_back( data[ streamPos ] );
			mainbuf[ bufPos ] = data[ streamPos ];
			++bufPos;
			if( bufPos >= 4096 )
				bufPos = 0;
			++streamPos;
		}
		else //Copy bytes from buffer
		{
			uint8_t chunk[ 2 ];
			chunk[ 1 ] = data[ streamPos + 1 ];
			chunk[ 0 ] = data[ streamPos ];

			streamPos += 2;

			uint16_t val = (chunk[ 0 ] << 8) | chunk[ 1 ];
			int copyLen = (val & 0xf) + 3;
			int copyPos = val >> 4;

			for( int i = 0; i < copyLen; ++i )
			{
				unsigned char byte = mainbuf[ copyPos ];
				out.push_back( byte );
				mainbuf[ bufPos ] = byte;

				++bufPos;
				if( bufPos >= 4096 )
					bufPos = 0;

				++copyPos;
				if( copyPos >= 4096 )
					copyPos = 0;
			}
		}

		--bitbufcnt;
		bitbuf >>= 1;
	}

	if( out.size() == desiredSize )
	{
		std::wcout << L"FILE SIZE MATCH! " + std::to_wstring( desiredSize ) + L" bytes expected, got " + std::to_wstring( (int)out.size() ) + L" DECOMPRESSION SUCCESSFUL!\n";
	}
	else if( out.size() == desiredSizeFlipped )
	{
		std::wcout << L"FILE SIZE MATCH! " + std::to_wstring( desiredSizeFlipped ) + L" bytes expected, got " + std::to_wstring( (int)out.size() ) + L" DECOMPRESSION SUCCESSFUL!\n";
	}
	else
		std::wcout << L"FILE SIZE MISMATCH! " + std::to_wstring( desiredSize ) + L" bytes expected, got " + std::to_wstring( (int)out.size() ) + L" DECOMPRESSION FAILED!\n";

	return out;
}

int main( int argc, char* argv[] )
{
    //std::cout << "Hello World!\n";

	std::string path = "";

	if( argc < 2 )
	{
		std::cout << "Not enough arguements to function\n";
	
		return 0;
	}

	path = argv[ 1 ];

	//path = "out.sgo";


	//Create input stream from path
	std::ifstream file( path, std::ios::binary | std::ios::ate );
	std::streamsize size = file.tellg();
	file.seekg( 0, std::ios::beg );

	std::vector<char> buffer( size );
	if( file.read( buffer.data(), size ) )
	{
		std::vector< char > decompressedBytes = CMPLDecompress( buffer, true );
		//std::vector< char > decompressedBytes = SGSLCompress( buffer, false );

		size_t lastindex = path.find_last_of( "." );
		std::string rawname = path.substr( 0, lastindex );

		std::cout << "Saving " + rawname + "_uncompressed.sgo\n";

		//Output
		std::ofstream file2 = std::ofstream( rawname + "_uncompressed.sgo", std::ios::binary | std::ios::out | std::ios::ate);
		for( int j = 0; j < decompressedBytes.size(); ++j )
		{
			file2 << decompressedBytes[ j ];
		}
		file2.close();
	}
	else
	{
		std::cout << "FILE NOT FOUND\n";
	}
	file.close();

	return 0;
}
