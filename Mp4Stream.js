import {VideoDecoder} from './PopEngine/VideoDecoder.js'
import PromiseQueue from './PopEngine/PromiseQueue.js'
import {LoadFileAsArrayBufferStreamAsync} from './PopEngine/FileSystem.js'


export default class Mp4Stream
{
	constructor(Url)
	{
		this.FrameQueue = new PromiseQueue();
		this.StreamPromise = this.StreamThread(Url);
		this.StreamPromise.catch( e => this.FrameQueue.Reject(e) );
	}
	
	async WaitForNextFrame()
	{
		//	would be nice to hook straight into current decoder?
		return this.FrameQueue.WaitForNext();
	}
	
	async StreamThread(Url)
	{
		const Decoder = new VideoDecoder();
		
		function OnChunk(Chunk)
		{
			Decoder.PushData(Chunk);
		}
		
		//	start file stream
		const LoadFilePromise = LoadFileAsArrayBufferStreamAsync(Url,false,OnChunk);
		
		while ( Decoder )
		{
			const NextFrame = await Decoder.WaitForNextFrame();
			//	eof
			if ( !NextFrame )
				break;
			this.FrameQueue.Push(NextFrame);
		}
		
		await LoadFilePromise;
		Decoder.PushEndOfFile();
	}
}

